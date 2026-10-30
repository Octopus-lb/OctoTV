const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500" | "w780" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";
export type ProfileSize = "w45" | "w185" | "original";

/**
 * Builds a TMDB image URL from the file path returned by the API.
 * The base URL is documented at https://developer.themoviedb.org/docs/image-basics
 * and may be changed by TMDB, so it is kept in one place.
 */
export function tmdbImage(
  path: string | null | undefined,
  size: PosterSize | BackdropSize | ProfileSize = "w500",
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path.startsWith("/") ? path : `/${path}`}`;
}

export function titlePoster(
  posterPath: string | null,
  source: string,
  size: PosterSize = "w500",
): string | null {
  if (!posterPath) return null;
  if (source === "anilist") return posterPath;
  return tmdbImage(posterPath, size);
}

export function titleBackdrop(
  backdropPath: string | null,
  source: string,
  size: BackdropSize = "w1280",
): string | null {
  if (!backdropPath) return null;
  if (source === "anilist") return backdropPath;
  return tmdbImage(backdropPath, size);
}
