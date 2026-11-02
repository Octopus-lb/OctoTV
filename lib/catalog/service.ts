import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Locale } from "@/lib/i18n/config";
import { anilist } from "@/lib/metadata/anilist";
import { tmdb, tmdbEnabled } from "@/lib/metadata/tmdb";
import {
  demoByType,
  demoCatalog,
  getDemoDetail,
} from "./demo-data";
import { getOpenDetail, isOpenId, openCatalog } from "./open-catalog";
import { getTitleFromDb, listTitlesFromDb } from "./repository";
import type {
  CatalogDetail,
  CatalogPage,
  CatalogQuery,
  CatalogTitle,
  TitleType,
} from "./types";

export type HomeSection = {
  key: string;
  labelKey: MessageKey;
  items: CatalogTitle[];
};

export type HomeData = {
  featured: CatalogTitle[];
  sections: HomeSection[];
  genres: Array<{ name: string; count: number }>;
  degraded: boolean;
};

/**
 * Fallback catalog used when neither the database nor TMDB is available.
 *
 * Real public-domain and CC BY films lead; the fictional demo series/anime
 * records stay only to exercise TV/anime layouts and are labelled DEMO.
 */
const fallbackCatalog: CatalogTitle[] = [
  ...openCatalog,
  ...demoCatalog.filter((item) => item.type !== "movie"),
];

function demoSorted(sort: CatalogQuery["sort"]): CatalogTitle[] {
  const items = [...fallbackCatalog];
  if (sort === "rating") {
    return items.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));
  }
  if (sort === "newest") {
    return items.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  }
  return items.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
}

function demoPage(query: CatalogQuery): CatalogPage {
  let items = demoSorted(query.sort);
  if (query.type) items = items.filter((item) => item.type === query.type);
  if (query.genre) {
    const genre = query.genre.toLowerCase();
    items = items.filter((item) =>
      item.genres.some((value) => value.toLowerCase() === genre),
    );
  }
  if (query.year) items = items.filter((item) => item.year === query.year);
  if (query.query?.trim()) {
    const term = query.query.trim().toLowerCase();
    items = items.filter((item) =>
      `${item.title} ${item.originalTitle} ${item.genres.join(" ")}`
        .toLowerCase()
        .includes(term),
    );
  }
  return {
    items,
    page: 1,
    totalPages: 1,
    totalResults: items.length,
    source: items.some((item) => item.source === "open") ? "mixed" : "demo",
  };
}

function collectGenres(items: CatalogTitle[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const genre of item.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export async function getHomeData(locale: Locale): Promise<HomeData> {
  const dbPage = await listTitlesFromDb({ page: 1, perPage: 60 });
  if (dbPage?.items.length) {
    const items = dbPage.items;
    const movies = items.filter((item) => item.type === "movie");
    const shows = items.filter((item) => item.type === "tv");
    const anime = items.filter((item) => item.type === "anime");
    const sections = (
      [
        { key: "trending", labelKey: "home.trending", items: items.slice(0, 12) },
        { key: "movies", labelKey: "home.popularMovies", items: movies.slice(0, 12) },
        { key: "shows", labelKey: "home.popularShows", items: shows.slice(0, 12) },
        { key: "anime", labelKey: "home.popularAnime", items: anime.slice(0, 12) },
      ] satisfies HomeSection[]
    ).filter((section) => section.items.length > 0);
    return {
      featured: items.slice(0, 5),
      sections,
      genres: collectGenres(items),
      degraded: false,
    };
  }

  const [trendingResult, movieResult, showResult, animeResult] =
    await Promise.allSettled([
      tmdbEnabled() ? tmdb.trending("all", "week", locale) : Promise.reject(new Error("tmdb disabled")),
      tmdbEnabled()
        ? tmdb.discover("movie", { sort_by: "popularity.desc" }, locale)
        : Promise.reject(new Error("tmdb disabled")),
      tmdbEnabled()
        ? tmdb.discover("tv", { sort_by: "popularity.desc" }, locale)
        : Promise.reject(new Error("tmdb disabled")),
      anilist.popular(1, locale),
    ]);

  const trending =
    trendingResult.status === "fulfilled" ? trendingResult.value.items : [];
  const movies =
    movieResult.status === "fulfilled" ? movieResult.value.items : [];
  const shows = showResult.status === "fulfilled" ? showResult.value.items : [];
  const anime = animeResult.status === "fulfilled" ? animeResult.value.items : [];

  const degraded = !trending.length;

  const fallbackMovies = movies.length ? movies : openCatalog;
  const fallbackShows = shows.length ? shows : demoByType("tv");
  const fallbackAnime = anime.length ? anime : demoByType("anime");
  const featuredPool = trending.length
    ? trending
    : [...fallbackMovies, ...fallbackShows, ...fallbackAnime];

  const sections = (
    [
      {
        key: "trending",
        labelKey: "home.trending",
        items: trending.length ? trending.slice(0, 12) : demoSorted("popularity").slice(0, 12),
      },
      { key: "movies", labelKey: "home.popularMovies", items: fallbackMovies.slice(0, 12) },
      { key: "shows", labelKey: "home.popularShows", items: fallbackShows.slice(0, 12) },
      { key: "anime", labelKey: "home.popularAnime", items: fallbackAnime.slice(0, 12) },
    ] satisfies HomeSection[]
  ).filter((section) => section.items.length > 0);

  return {
    featured: featuredPool.slice(0, 5),
    sections,
    genres: collectGenres(featuredPool),
    degraded,
  };
}

export async function listCatalog(
  query: CatalogQuery,
  locale: Locale,
): Promise<CatalogPage> {
  const dbPage = await listTitlesFromDb(query);
  if (dbPage?.items.length) return dbPage;

  if (query.query?.trim()) {
    const term = query.query.trim();
    const results = await Promise.allSettled([
      tmdbEnabled() ? tmdb.search(term, query.page ?? 1, locale) : Promise.reject(new Error("disabled")),
      anilist.search(term, query.page ?? 1, locale),
    ]);
    const merged = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value.items : [],
    );
    const filtered = query.type
      ? merged.filter((item) => item.type === query.type)
      : merged;
    if (filtered.length) {
      return {
        items: filtered,
        page: 1,
        totalPages: 1,
        totalResults: filtered.length,
        source: "mixed",
      };
    }
    return demoPage(query);
  }

  if (query.type === "anime") {
    const anime = await anilist.popular(query.page ?? 1, locale).catch(() => null);
    if (anime?.items.length) return anime;
    return demoPage(query);
  }

  if (tmdbEnabled()) {
    const type = query.type === "tv" ? "tv" : "movie";
    const page = await tmdb
      .discover(
        type,
        {
          page: query.page ?? 1,
          with_genres: query.genre,
          primary_release_year: type === "movie" ? query.year : undefined,
          first_air_date_year: type === "tv" ? query.year : undefined,
          sort_by:
            query.sort === "rating"
              ? "vote_average.desc"
              : query.sort === "newest"
                ? "primary_release_date.desc"
                : "popularity.desc",
        },
        locale,
      )
      .catch(() => null);
    if (page?.items.length) return page;
  }

  return demoPage(query);
}

function typeFromId(id: string): TitleType | null {
  if (id.startsWith("tmdb-movie-")) return "movie";
  if (id.startsWith("tmdb-tv-")) return "tv";
  if (id.startsWith("anilist-")) return "anime";
  return null;
}

export async function getTitleDetail(
  id: string,
  locale: Locale,
  typeHint?: TitleType,
): Promise<CatalogDetail | null> {
  if (id.startsWith("open-")) return getOpenDetail(id);
  if (id.startsWith("demo-")) return getDemoDetail(id);

  const fromDb = await getTitleFromDb(id);
  if (fromDb) return fromDb;

  const type = typeHint ?? typeFromId(id);

  if (id.startsWith("anilist-") && tmdbEnabled() === false) {
    const anilistId = Number(id.slice("anilist-".length));
    if (Number.isFinite(anilistId)) {
      return anilist.details(anilistId, locale).catch(() => null);
    }
  }

  if (id.startsWith("anilist-")) {
    const anilistId = Number(id.slice("anilist-".length));
    if (Number.isFinite(anilistId)) {
      return anilist.details(anilistId, locale).catch(() => null);
    }
  }

  if (id.startsWith("tmdb-") && tmdbEnabled()) {
    const match = /^tmdb-(movie|tv)-(\d+)$/.exec(id);
    if (match) {
      return tmdb
        .details(match[1] as "movie" | "tv", Number(match[2]), locale)
        .catch(() => null);
    }
  }

  if (type && tmdbEnabled()) {
    const match = /^tmdb-(?:movie|tv)-(\d+)$/.exec(id);
    if (match) {
      return tmdb
        .details(type === "tv" ? "tv" : "movie", Number(match[1]), locale)
        .catch(() => null);
    }
  }

  return null;
}

export function isDemoId(id: string): boolean {
  return id.startsWith("demo-");
}

export { isOpenId };
