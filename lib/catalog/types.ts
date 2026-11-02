export type TitleType = "movie" | "tv" | "anime";

export type MetadataSource = "tmdb" | "anilist" | "demo" | "open";

/** Distribution license for content that OctoTV may stream without a contract. */
export type CatalogLicense = {
  name: string;
  url: string;
  attribution: string;
  sourceUrl: string;
  downloadable: boolean;
};

export type CatalogTitle = {
  id: string;
  type: TitleType;
  tmdbId: number | null;
  anilistId: number | null;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  overview: string;
  tagline: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  year: number | null;
  runtimeMinutes: number | null;
  episodeCount: number | null;
  seasonCount: number | null;
  status: string | null;
  originalLanguage: string | null;
  voteAverage: number | null;
  popularity: number | null;
  genres: string[];
  trailerKey: string | null;
  source: MetadataSource;
  isDemo: boolean;
  license?: CatalogLicense;
};

export type CatalogCastMember = {
  id: string;
  name: string;
  character: string | null;
  profilePath: string | null;
  department: string;
};

export type CatalogEpisode = {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview: string;
  runtimeMinutes: number | null;
  airDate: string | null;
  stillPath: string | null;
};

export type CatalogSeason = {
  id: string;
  seasonNumber: number;
  title: string;
  overview: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
  episodes: CatalogEpisode[];
};

export type CatalogDetail = CatalogTitle & {
  cast: CatalogCastMember[];
  recommendations: CatalogTitle[];
  seasons: CatalogSeason[];
};

export type CatalogQuery = {
  type?: TitleType;
  query?: string;
  genre?: string;
  year?: number;
  sort?: "popularity" | "rating" | "newest";
  page?: number;
  perPage?: number;
};

export type CatalogPage = {
  items: CatalogTitle[];
  page: number;
  totalPages: number;
  totalResults: number;
  source: MetadataSource | "mixed";
  degraded?: boolean;
};
