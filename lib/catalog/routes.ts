import type { TitleType } from "./types";
import type { Locale } from "@/lib/i18n/config";

const detailPrefix: Record<TitleType, string> = {
  movie: "movie",
  tv: "show",
  anime: "anime",
};

export function detailPath(type: TitleType, id: string): string {
  return `/${detailPrefix[type]}/${encodeURIComponent(id)}`;
}

export function watchPath(type: TitleType, id: string, episodeId?: string): string {
  const base = `/watch/${type}/${encodeURIComponent(id)}`;
  return episodeId ? `${base}?episode=${encodeURIComponent(episodeId)}` : base;
}

export function localeDetailPath(
  locale: Locale,
  type: TitleType,
  id: string,
): string {
  return `/${locale}${detailPath(type, id)}`;
}

export function localeWatchPath(
  locale: Locale,
  type: TitleType,
  id: string,
  episodeId?: string,
): string {
  return `/${locale}${watchPath(type, id, episodeId)}`;
}
