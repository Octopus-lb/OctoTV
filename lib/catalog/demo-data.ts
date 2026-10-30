import type {
  CatalogDetail,
  CatalogEpisode,
  CatalogSeason,
  CatalogTitle,
  TitleType,
} from "./types";

/**
 * Demo catalog.
 *
 * The films below are public-domain works. Playback for this catalog uses
 * publicly available player test streams (see lib/playback/providers/demo.ts)
 * and exists only to verify the player. Series/anime entries are clearly
 * labelled demo records; they do not represent licensed content.
 */
export const DEMO_TITLE_IDS = [
  "demo-night-of-the-living-dead",
  "demo-nosferatu",
  "demo-metropolis",
  "demo-his-girl-friday",
  "demo-the-general",
  "demo-plan-9",
  "demo-series-atlas",
  "demo-anime-orion",
] as const;

type DemoSeed = Omit<
  CatalogTitle,
  | "id"
  | "tmdbId"
  | "anilistId"
  | "imdbId"
  | "posterPath"
  | "backdropPath"
  | "source"
  | "isDemo"
  | "year"
> & {
  id: string;
  slugGenres?: string[];
};

const movieSeeds: DemoSeed[] = [
  {
    id: "demo-night-of-the-living-dead",
    type: "movie",
    title: "Night of the Living Dead",
    originalTitle: "Night of the Living Dead",
    overview:
      "A group of strangers barricade themselves in a rural farmhouse as the recently dead begin to rise. George A. Romero's landmark independent horror film helped define the modern zombie genre.",
    tagline: "They won't stay dead.",
    releaseDate: "1968-10-01",
    runtimeMinutes: 96,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: "en",
    voteAverage: 7.6,
    popularity: 94,
    genres: ["Horror", "Drama"],
    trailerKey: null,
  },
  {
    id: "demo-nosferatu",
    type: "movie",
    title: "Nosferatu",
    originalTitle: "Nosferatu, eine Symphonie des Grauens",
    overview:
      "An estate agent travels to a remote castle to close a sale, unaware that his client is an ancient vampire. F. W. Murnau's silent expressionist classic remains one of cinema's most influential horror films.",
    tagline: "A symphony of horror.",
    releaseDate: "1922-03-04",
    runtimeMinutes: 94,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: "de",
    voteAverage: 7.9,
    popularity: 87,
    genres: ["Horror", "Fantasy"],
    trailerKey: null,
  },
  {
    id: "demo-metropolis",
    type: "movie",
    title: "Metropolis",
    originalTitle: "Metropolis",
    overview:
      "In a towering future city, the wealthy live above while workers toil beneath the surface. Fritz Lang's science-fiction epic defined the visual language of the genre.",
    tagline: "There can be no understanding between the hands and the brain unless the heart acts as mediator.",
    releaseDate: "1927-01-10",
    runtimeMinutes: 153,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: "de",
    voteAverage: 8.2,
    popularity: 92,
    genres: ["Science Fiction", "Drama"],
    trailerKey: null,
  },
  {
    id: "demo-his-girl-friday",
    type: "movie",
    title: "His Girl Friday",
    originalTitle: "His Girl Friday",
    overview:
      "A newspaper editor schemes to keep his ace reporter and ex-wife from remarrying, all while chasing the story of the year. Howard Hawks' rapid-fire comedy is a benchmark of screwball dialogue.",
    tagline: "The comedy hit that made headlines!",
    releaseDate: "1940-01-11",
    runtimeMinutes: 92,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: "en",
    voteAverage: 7.3,
    popularity: 61,
    genres: ["Comedy", "Romance"],
    trailerKey: null,
  },
  {
    id: "demo-the-general",
    type: "movie",
    title: "The General",
    originalTitle: "The General",
    overview:
      "A railway engineer pursues the hijackers of his beloved locomotive during the American Civil War. Buster Keaton's stunt work remains astonishing a century later.",
    tagline: null,
    releaseDate: "1926-12-25",
    runtimeMinutes: 78,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: "en",
    voteAverage: 8.1,
    popularity: 54,
    genres: ["Comedy", "Action", "Adventure"],
    trailerKey: null,
  },
  {
    id: "demo-plan-9",
    type: "movie",
    title: "Plan 9 from Outer Space",
    originalTitle: "Plan 9 from Outer Space",
    overview:
      "Aliens attempt to stop humanity from developing a weapon that could destroy the universe by resurrecting the dead. Ed Wood's notorious film is an enduring cult favourite.",
    tagline: "Unspeakable horrors from outer space paralyze the living and resurrect the dead!",
    releaseDate: "1959-07-22",
    runtimeMinutes: 79,
    episodeCount: null,
    seasonCount: null,
    status: "Released",
    originalLanguage: "en",
    voteAverage: 3.9,
    popularity: 48,
    genres: ["Science Fiction", "Horror"],
    trailerKey: null,
  },
];

const seriesSeed: DemoSeed = {
  id: "demo-series-atlas",
  type: "tv",
  title: "Atlas Line (Demo)",
  originalTitle: "Atlas Line",
  overview:
    "A demonstration series used to exercise season selection, episode progress and next-episode playback. It is not a licensed production.",
  tagline: "Every route has a cost.",
  releaseDate: "2025-02-14",
  runtimeMinutes: 45,
  episodeCount: 6,
  seasonCount: 1,
  status: "Returning Series",
  originalLanguage: "en",
  voteAverage: 8.3,
  popularity: 130,
  genres: ["Thriller", "Drama"],
  trailerKey: null,
};

const animeSeed: DemoSeed = {
  id: "demo-anime-orion",
  type: "anime",
  title: "Echoes of Orion (Demo)",
  originalTitle: "オリオン・エコーズ",
  overview:
    "A demonstration anime record used to verify AniList-style metadata rendering and the anime catalog. It is not a licensed production.",
  tagline: "Signals travel further than memory.",
  releaseDate: "2026-01-09",
  runtimeMinutes: 24,
  episodeCount: 7,
  seasonCount: 1,
  status: "RELEASING",
  originalLanguage: "ja",
  voteAverage: 8.7,
  popularity: 210,
  genres: ["Science Fiction", "Adventure"],
  trailerKey: null,
};

function toTitle(seed: DemoSeed): CatalogTitle {
  return {
    id: seed.id,
    type: seed.type,
    tmdbId: null,
    anilistId: null,
    imdbId: null,
    title: seed.title,
    originalTitle: seed.originalTitle,
    overview: seed.overview,
    tagline: seed.tagline,
    posterPath: null,
    backdropPath: null,
    releaseDate: seed.releaseDate,
    year: seed.releaseDate ? Number(seed.releaseDate.slice(0, 4)) : null,
    runtimeMinutes: seed.runtimeMinutes,
    episodeCount: seed.episodeCount,
    seasonCount: seed.seasonCount,
    status: seed.status,
    originalLanguage: seed.originalLanguage,
    voteAverage: seed.voteAverage,
    popularity: seed.popularity,
    genres: seed.genres,
    trailerKey: seed.trailerKey,
    source: "demo",
    isDemo: true,
  };
}

export const demoCatalog: CatalogTitle[] = [...movieSeeds, seriesSeed, animeSeed].map(
  toTitle,
);

function buildSeasons(title: CatalogTitle): CatalogSeason[] {
  if (title.type === "movie" || !title.episodeCount) return [];
  const seasonCount = title.seasonCount ?? 1;
  const perSeason = Math.ceil(title.episodeCount / seasonCount);
  const seasons: CatalogSeason[] = [];
  for (let seasonIndex = 1; seasonIndex <= seasonCount; seasonIndex += 1) {
    const episodes: CatalogEpisode[] = [];
    for (let episodeIndex = 1; episodeIndex <= perSeason; episodeIndex += 1) {
      episodes.push({
        id: `${title.id}-s${seasonIndex}e${episodeIndex}`,
        seasonNumber: seasonIndex,
        episodeNumber: episodeIndex,
        title: `Episode ${episodeIndex}`,
        overview:
          "Demo episode entry. Episode metadata is replaced by TMDB or AniList when a metadata credential is configured and synchronization runs.",
        runtimeMinutes: title.runtimeMinutes,
        airDate: title.releaseDate
          ? new Date(
              Date.parse(title.releaseDate) + (episodeIndex - 1) * 7 * 86_400_000,
            )
              .toISOString()
              .slice(0, 10)
          : null,
        stillPath: null,
      });
    }
    seasons.push({
      id: `${title.id}-season-${seasonIndex}`,
      seasonNumber: seasonIndex,
      title: seasonIndex === 1 ? "Season 1" : `Season ${seasonIndex}`,
      overview: "Demo season.",
      episodeCount: episodes.length,
      airDate: title.releaseDate,
      posterPath: null,
      episodes,
    });
  }
  return seasons;
}

export function getDemoTitle(id: string): CatalogTitle | null {
  return demoCatalog.find((title) => title.id === id) ?? null;
}

export function getDemoDetail(id: string): CatalogDetail | null {
  const title = getDemoTitle(id);
  if (!title) return null;
  const recommendations = demoCatalog
    .filter((item) => item.id !== title.id && item.type === title.type)
    .slice(0, 6);
  return {
    ...title,
    cast: [],
    recommendations,
    seasons: buildSeasons(title),
  };
}

export function demoByType(type: TitleType): CatalogTitle[] {
  return demoCatalog.filter((title) => title.type === type);
}
