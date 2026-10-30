import { env as cloudflareEnv } from "cloudflare:workers";
import type { Locale } from "@/lib/i18n/config";
import type {
  CatalogCastMember,
  CatalogDetail,
  CatalogEpisode,
  CatalogPage,
  CatalogSeason,
  CatalogTitle,
} from "@/lib/catalog/types";
import { cached } from "./cache";

const TMDB_BASE = "https://api.themoviedb.org/3";

export type TmdbMediaType = "movie" | "tv";

const languageMap: Record<Locale, string> = {
  ar: "ar",
  en: "en-US",
  tr: "tr-TR",
  fr: "fr-FR",
};

export function tmdbEnabled(): boolean {
  return Boolean(
    cloudflareEnv.TMDB_READ_ACCESS_TOKEN || cloudflareEnv.TMDB_API_READ_TOKEN,
  );
}

function token(): string {
  const value =
    cloudflareEnv.TMDB_READ_ACCESS_TOKEN ?? cloudflareEnv.TMDB_API_READ_TOKEN;
  if (!value) throw new Error("TMDB_READ_ACCESS_TOKEN is not configured.");
  return value;
}

type TmdbQuery = Record<string, string | number | boolean | undefined>;

async function tmdbRequest<T>(
  path: string,
  params: TmdbQuery = {},
  locale: Locale = "en",
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("language", languageMap[locale] ?? "en-US");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(12_000),
  }).catch((error: unknown) => {
    throw new Error(`TMDB request failed: ${(error as Error).message}`);
  });

  if (!response.ok) {
    throw new Error(`TMDB responded ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

type TmdbTitle = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  tagline?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  original_language?: string;
  vote_average?: number;
  popularity?: number;
  adult?: boolean;
  genres?: Array<{ id: number; name: string }>;
  imdb_id?: string | null;
  external_ids?: { imdb_id?: string | null };
  videos?: { results?: TmdbVideo[] };
  credits?: { cast?: TmdbCast[]; crew?: TmdbCast[] };
  recommendations?: { results?: TmdbTitle[] };
  translations?: {
    translations?: Array<{
      iso_639_1: string;
      data: { title?: string; name?: string; overview?: string; tagline?: string };
    }>;
  };
  seasons?: TmdbSeason[];
  episode_count?: number;
  air_date?: string | null;
  season_number?: number;
  episode_number?: number;
  still_path?: string | null;
};

type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  iso_639_1?: string;
};

type TmdbCast = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  department?: string;
  order?: number;
  job?: string;
};

type TmdbSeason = {
  id: number;
  season_number: number;
  name?: string;
  overview?: string;
  episode_count?: number;
  air_date?: string | null;
  poster_path?: string | null;
  episodes?: TmdbTitle[];
};

type TmdbList = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbTitle[];
};

function pickTrailer(videos: TmdbVideo[] | undefined): string | null {
  if (!videos?.length) return null;
  const youtube = videos.filter((video) => video.site === "YouTube");
  const official = youtube.find(
    (video) => video.type === "Trailer" && video.official !== false,
  );
  return (official ?? youtube.find((video) => video.type === "Trailer") ?? youtube[0])
    ?.key ?? null;
}

function localizedFields(item: TmdbTitle, locale: Locale): {
  title: string;
  overview: string;
  tagline: string | null;
} {
  const baseTitle = item.title ?? item.name ?? item.original_title ?? item.original_name ?? "Untitled";
  const baseOverview = item.overview ?? "";
  const translation = item.translations?.translations?.find(
    (entry) => entry.iso_639_1 === locale,
  );
  if (!translation) {
    return { title: baseTitle, overview: baseOverview, tagline: item.tagline ?? null };
  }
  return {
    title: translation.data.title ?? translation.data.name ?? baseTitle,
    overview: translation.data.overview || baseOverview,
    tagline: translation.data.tagline ?? item.tagline ?? null,
  };
}

export function normalizeTmdbTitle(
  item: TmdbTitle,
  type: TmdbMediaType,
  locale: Locale = "en",
): CatalogTitle {
  const localized = localizedFields(item, locale);
  const releaseDate =
    item.release_date || item.first_air_date || item.air_date || null;
  const runtime =
    item.runtime ??
    (Array.isArray(item.episode_run_time) ? item.episode_run_time[0] : undefined) ??
    null;

  return {
    id: `tmdb-${type}-${item.id}`,
    type: type === "movie" ? "movie" : "tv",
    tmdbId: item.id,
    anilistId: null,
    imdbId: item.imdb_id ?? item.external_ids?.imdb_id ?? null,
    title: localized.title,
    originalTitle:
      item.original_title ?? item.original_name ?? localized.title,
    overview: localized.overview,
    tagline: localized.tagline,
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    releaseDate,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) || null : null,
    runtimeMinutes: runtime,
    episodeCount: item.number_of_episodes ?? item.episode_count ?? null,
    seasonCount: item.number_of_seasons ?? null,
    status: item.status ?? null,
    originalLanguage: item.original_language ?? null,
    voteAverage: item.vote_average ?? null,
    popularity: item.popularity ?? null,
    genres: (item.genres ?? []).map((genre) => genre.name),
    trailerKey: pickTrailer(item.videos?.results),
    source: "tmdb",
    isDemo: false,
  };
}

function normalizeSeason(season: TmdbSeason): CatalogSeason {
  const episodes: CatalogEpisode[] = (season.episodes ?? []).map((episode) => ({
    id: `tmdb-episode-${episode.id}`,
    seasonNumber: episode.season_number ?? season.season_number,
    episodeNumber: episode.episode_number ?? 0,
    title: episode.name ?? episode.title ?? `Episode ${episode.episode_number}`,
    overview: episode.overview ?? "",
    runtimeMinutes:
      episode.runtime ??
      (Array.isArray(episode.episode_run_time) ? episode.episode_run_time[0] : null) ??
      null,
    airDate: episode.air_date ?? null,
    stillPath: episode.still_path ?? null,
  }));

  return {
    id: `tmdb-season-${season.id}`,
    seasonNumber: season.season_number,
    title: season.name ?? `Season ${season.season_number}`,
    overview: season.overview ?? "",
    episodeCount: season.episode_count ?? episodes.length,
    airDate: season.air_date ?? null,
    posterPath: season.poster_path ?? null,
    episodes,
  };
}

function normalizeCast(cast: TmdbCast[] | undefined): CatalogCastMember[] {
  return (cast ?? []).slice(0, 24).map((member) => ({
    id: `tmdb-person-${member.id}`,
    name: member.name,
    character: member.character ?? member.job ?? null,
    profilePath: member.profile_path ?? null,
    department: member.department ?? "Acting",
  }));
}

async function listRequest(
  path: string,
  params: TmdbQuery,
  type: TmdbMediaType,
  locale: Locale,
): Promise<CatalogPage> {
  const data = await tmdbRequest<TmdbList>(path, params, locale);
  return {
    items: (data.results ?? [])
      .filter((item) => item.media_type !== "person")
      .map((item) => normalizeTmdbTitle(item, type, locale)),
    page: data.page ?? 1,
    totalPages: Math.min(data.total_pages ?? 1, 500),
    totalResults: data.total_results ?? 0,
    source: "tmdb",
  };
}

export const tmdb = {
  trending(
    type: "all" | TmdbMediaType,
    window: "day" | "week",
    locale: Locale,
  ): Promise<CatalogPage> {
    const mediaType: TmdbMediaType = type === "tv" ? "tv" : "movie";
    return cached(
      `tmdb:trending:${type}:${window}:${locale}`,
      () => listRequest(`/trending/${type}/${window}`, {}, mediaType, locale),
      { ttlMs: 15 * 60 * 1000, staleOnError: true },
    );
  },

  discover(
    type: TmdbMediaType,
    params: TmdbQuery,
    locale: Locale,
  ): Promise<CatalogPage> {
    return cached(
      `tmdb:discover:${type}:${JSON.stringify(params)}:${locale}`,
      () =>
        listRequest(`/discover/${type}`, { sort_by: "popularity.desc", ...params }, type, locale),
      { ttlMs: 15 * 60 * 1000, staleOnError: true },
    );
  },

  search(query: string, page: number, locale: Locale): Promise<CatalogPage> {
    return cached(
      `tmdb:search:${query}:${page}:${locale}`,
      async () => {
        const data = await tmdbRequest<TmdbList>(
          "/search/multi",
          { query, page, include_adult: false },
          locale,
        );
        const items = (data.results ?? [])
          .filter((item) => item.media_type === "movie" || item.media_type === "tv")
          .map((item) =>
            normalizeTmdbTitle(
              item,
              item.media_type === "tv" ? "tv" : "movie",
              locale,
            ),
          );
        return {
          items,
          page: data.page ?? 1,
          totalPages: Math.min(data.total_pages ?? 1, 500),
          totalResults: data.total_results ?? 0,
          source: "tmdb" as const,
        };
      },
      { ttlMs: 5 * 60 * 1000, staleOnError: true },
    );
  },

  async details(
    type: TmdbMediaType,
    id: number,
    locale: Locale,
  ): Promise<CatalogDetail> {
    return cached(
      `tmdb:detail:${type}:${id}:${locale}`,
      async () => {
        const data = await tmdbRequest<TmdbTitle>(
          `/${type}/${id}`,
          {
            append_to_response:
              "videos,credits,recommendations,external_ids,translations",
          },
          locale,
        );
        const title = normalizeTmdbTitle(data, type, locale);
        const seasons = (data.seasons ?? []).map(normalizeSeason);
        return {
          ...title,
          cast: normalizeCast(data.credits?.cast),
          recommendations: (data.recommendations?.results ?? [])
            .slice(0, 12)
            .map((item) => normalizeTmdbTitle(item, type, locale)),
          seasons,
        };
      },
      { ttlMs: 60 * 60 * 1000, staleOnError: true },
    );
  },

  async season(
    id: number,
    seasonNumber: number,
    locale: Locale,
  ): Promise<CatalogSeason> {
    return cached(
      `tmdb:season:${id}:${seasonNumber}:${locale}`,
      async () => {
        const data = await tmdbRequest<TmdbSeason>(
          `/tv/${id}/season/${seasonNumber}`,
          {},
          locale,
        );
        return normalizeSeason(data);
      },
      { ttlMs: 6 * 60 * 60 * 1000, staleOnError: true },
    );
  },
};

export type { TmdbTitle };
