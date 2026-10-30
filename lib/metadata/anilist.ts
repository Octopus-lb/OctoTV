import { env as cloudflareEnv } from "cloudflare:workers";
import type {
  CatalogCastMember,
  CatalogDetail,
  CatalogPage,
  CatalogSeason,
  CatalogTitle,
} from "@/lib/catalog/types";
import { cached } from "./cache";

const DEFAULT_ENDPOINT = "https://graphql.anilist.co";

type AniListMedia = {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  description?: string | null;
  status?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  duration?: number | null;
  genres?: string[];
  coverImage?: { extraLarge?: string | null; large?: string | null; color?: string | null };
  bannerImage?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  isAdult?: boolean;
  trailer?: { id?: string | null; site?: string | null } | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  format?: string | null;
  characters?: {
    edges?: Array<{
      role?: string;
      node: { id: number; name: { full: string }; image?: { large?: string | null } };
    }>;
  };
  recommendations?: {
    nodes?: Array<{ mediaRecommendation?: AniListMedia | null }>;
  };
};

type AniListPage = {
  pageInfo?: { currentPage: number; lastPage: number; total: number };
  media?: AniListMedia[];
};

type AniListResponse = {
  data?: {
    Page?: AniListPage;
    Media?: AniListMedia;
  };
  errors?: Array<{ message: string; status?: number }>;
};

const LIST_QUERY = `
query OctoList($page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $genre: String, $seasonYear: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage lastPage total }
    media(type: ANIME, search: $search, sort: $sort, genre: $genre, seasonYear: $seasonYear, isAdult: false) {
      id
      title { romaji english native }
      description
      status
      season
      seasonYear
      episodes
      duration
      genres
      coverImage { extraLarge large color }
      bannerImage
      averageScore
      popularity
      isAdult
      trailer { id site }
      startDate { year month day }
      format
    }
  }
}`;

const DETAIL_QUERY = `
query OctoDetail($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    description
    status
    season
    seasonYear
    episodes
    duration
    genres
    coverImage { extraLarge large color }
    bannerImage
    averageScore
    popularity
    isAdult
    trailer { id site }
    startDate { year month day }
    format
    characters(perPage: 24, sort: [ROLE, RELEVANCE, ID]) {
      edges { role node { id name { full } image { large } } }
    }
    recommendations(perPage: 12, sort: [RATING_DESC]) {
      nodes { mediaRecommendation { id title { romaji english native } description status seasonYear episodes duration genres coverImage { extraLarge large } bannerImage averageScore popularity isAdult trailer { id site } startDate { year month day } format } }
    }
  }
}`;

function endpoint(): string {
  return cloudflareEnv.ANILIST_GRAPHQL_URL || DEFAULT_ENDPOINT;
}

async function anilistRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const attempt = async (): Promise<Response> =>
    fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15_000),
    });

  let response = await attempt();

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? "2");
    const waitMs = Math.min(Math.max(retryAfter, 1), 5) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    response = await attempt();
  }

  if (!response.ok) {
    throw new Error(`AniList responded ${response.status}`);
  }

  const payload = (await response.json()) as AniListResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "AniList GraphQL error");
  }
  if (!payload.data) throw new Error("AniList returned no data");
  return payload.data as T;
}

function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toDate(startDate?: AniListMedia["startDate"]): string | null {
  if (!startDate?.year) return null;
  const month = String(startDate.month ?? 1).padStart(2, "0");
  const day = String(startDate.day ?? 1).padStart(2, "0");
  return `${startDate.year}-${month}-${day}`;
}

export function normalizeAniList(item: AniListMedia): CatalogTitle {
  const title =
    item.title.english || item.title.romaji || item.title.native || "Untitled";
  const releaseDate = toDate(item.startDate);
  return {
    id: `anilist-${item.id}`,
    type: "anime",
    tmdbId: null,
    anilistId: item.id,
    imdbId: null,
    title,
    originalTitle: item.title.native || item.title.romaji || title,
    overview: stripHtml(item.description),
    tagline: null,
    posterPath: item.coverImage?.extraLarge ?? item.coverImage?.large ?? null,
    backdropPath: item.bannerImage ?? null,
    releaseDate,
    year: item.seasonYear ?? item.startDate?.year ?? null,
    runtimeMinutes: item.duration ?? null,
    episodeCount: item.episodes ?? null,
    seasonCount: null,
    status: item.status ?? null,
    originalLanguage: "ja",
    voteAverage: item.averageScore ? item.averageScore / 10 : null,
    popularity: item.popularity ?? null,
    genres: item.genres ?? [],
    trailerKey:
      item.trailer?.site?.toLowerCase() === "youtube" ? item.trailer.id ?? null : null,
    source: "anilist",
    isDemo: false,
  };
}

function toPage(page: AniListPage | undefined, pageNumber: number): CatalogPage {
  const info = page?.pageInfo;
  return {
    items: (page?.media ?? [])
      .filter((media) => !media.isAdult)
      .map(normalizeAniList),
    page: info?.currentPage ?? pageNumber,
    totalPages: Math.min(info?.lastPage ?? 1, 200),
    totalResults: info?.total ?? 0,
    source: "anilist",
  };
}

export const anilist = {
  popular(page = 1, locale = "en"): Promise<CatalogPage> {
    return cached(
      `anilist:popular:${page}:${locale}`,
      async () => {
        const data = await anilistRequest<{ Page: AniListPage }>(LIST_QUERY, {
          page,
          perPage: 20,
          sort: ["TRENDING_DESC", "POPULARITY_DESC"],
        });
        return toPage(data.Page, page);
      },
      { ttlMs: 30 * 60 * 1000, staleOnError: true },
    );
  },

  search(query: string, page = 1, locale = "en"): Promise<CatalogPage> {
    return cached(
      `anilist:search:${query}:${page}:${locale}`,
      async () => {
        const data = await anilistRequest<{ Page: AniListPage }>(LIST_QUERY, {
          page,
          perPage: 20,
          search: query,
          sort: ["SEARCH_MATCH"],
        });
        return toPage(data.Page, page);
      },
      { ttlMs: 10 * 60 * 1000, staleOnError: true },
    );
  },

  async details(id: number, locale = "en"): Promise<CatalogDetail> {
    return cached(
      `anilist:detail:${id}:${locale}`,
      async () => {
        const data = await anilistRequest<{ Media: AniListMedia }>(DETAIL_QUERY, {
          id,
        });
        const media = data.Media;
        const title = normalizeAniList(media);
        const cast: CatalogCastMember[] = (media.characters?.edges ?? []).map(
          (edge) => ({
            id: `anilist-character-${edge.node.id}`,
            name: edge.node.name.full,
            character: edge.role ?? null,
            profilePath: edge.node.image?.large ?? null,
            department: "Character",
          }),
        );
        const recommendations = (media.recommendations?.nodes ?? [])
          .map((node) => node.mediaRecommendation)
          .filter((item): item is AniListMedia => Boolean(item))
          .map(normalizeAniList);

        const episodeCount = media.episodes ?? 0;
        const seasons: CatalogSeason[] =
          episodeCount > 0
            ? [
                {
                  id: `${title.id}-season-1`,
                  seasonNumber: 1,
                  title: media.season ? `${media.season} ${media.seasonYear ?? ""}`.trim() : "Season 1",
                  overview: "",
                  episodeCount,
                  airDate: title.releaseDate,
                  posterPath: title.posterPath,
                  episodes: Array.from({ length: episodeCount }, (_, index) => ({
                    id: `${title.id}-episode-${index + 1}`,
                    seasonNumber: 1,
                    episodeNumber: index + 1,
                    title: `Episode ${index + 1}`,
                    overview: "",
                    runtimeMinutes: media.duration ?? null,
                    airDate: null,
                    stillPath: null,
                  })),
                },
              ]
            : [];

        return { ...title, cast, recommendations, seasons };
      },
      { ttlMs: 60 * 60 * 1000, staleOnError: true },
    );
  },
};
