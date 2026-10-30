import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/player/video-player";
import { detailPath, watchPath } from "@/lib/catalog/routes";
import { getTitleDetail } from "@/lib/catalog/service";
import type { TitleType } from "@/lib/catalog/types";
import { getPlaybackOptions } from "@/lib/playback/service";
import { getPlaybackProgress } from "@/lib/activity/repository";
import { getViewer } from "@/lib/profiles/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

function parseType(value: string): TitleType | null {
  return value === "movie" || value === "tv" || value === "anime" ? value : null;
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; type: string; id: string }>;
  searchParams: Promise<{ episode?: string }>;
}) {
  const { locale: raw, type: rawType, id } = await params;
  const { episode } = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const type = parseType(rawType);
  if (!type) notFound();

  const detail = await getTitleDetail(id, locale, type);
  if (!detail) notFound();

  const { t } = createTranslator(locale);
  const viewer = await getViewer();
  const [options, resumeSeconds] = await Promise.all([
    getPlaybackOptions(id, viewer?.profile.id),
    viewer
      ? getPlaybackProgress(viewer.profile.id, id, episode ?? null)
      : Promise.resolve(0),
  ]);

  const episodes = detail.seasons.flatMap((season) => season.episodes);
  const currentIndex = episode
    ? episodes.findIndex((item) => item.id === episode)
    : -1;
  const nextEpisode =
    currentIndex >= 0
      ? episodes[currentIndex + 1]
      : type === "movie"
        ? undefined
        : episodes[0];

  return (
    <main className="watch-page">
      <VideoPlayer
        locale={locale}
        contentId={id}
        title={detail.title}
        episodeId={episode ?? null}
        options={options}
        trackProgress={Boolean(viewer)}
        resumeSeconds={resumeSeconds}
        nextHref={
          nextEpisode
            ? localePath(locale, watchPath(type, id, nextEpisode.id))
            : null
        }
        nextLabel={nextEpisode ? t("player.nextEpisode") : null}
        backHref={localePath(locale, detailPath(type, id))}
        backLabel={t("player.backToDetails")}
      />
      {options.length === 0 && (
        <p className="rights-note watch-note">{t("catalog.playUnavailableBody")}</p>
      )}
    </main>
  );
}
