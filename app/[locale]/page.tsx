import { notFound } from "next/navigation";
import { ContentRow } from "@/components/content-row";
import { GenreGrid } from "@/components/genre-grid";
import { HeroShowcase } from "@/components/hero-showcase";
import { LiveExperience } from "@/components/live/live-experience";
import { MediaCard } from "@/components/media-card";
import { getHomeData } from "@/lib/catalog/service";
import { getContinueWatching } from "@/lib/activity/repository";
import { getViewer } from "@/lib/profiles/server";
import { createTranslator } from "@/lib/i18n";
import { localePath, isLocale, type Locale } from "@/lib/i18n/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { t } = createTranslator(locale);

  const [home, viewer] = await Promise.all([getHomeData(locale), getViewer()]);
  const continueWatching = viewer
    ? await getContinueWatching(viewer.profile.id, 12)
    : [];

  return (
    <main>
      <HeroShowcase items={home.featured} locale={locale} />

      {home.degraded && (
        <div className="demo-notice" role="status">
          <span className="demo-pill">{t("common.demo")}</span>
          {t("common.demoNotice")}
        </div>
      )}

      {continueWatching.length > 0 && (
        <section className="content-section overlap-section">
          <div className="section-heading">
            <div>
              <span className="kicker">{t("common.profile")}</span>
              <h2>{t("home.continueWatching")}</h2>
            </div>
            <Link href={localePath(locale, "/history")} className="view-all">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="media-grid compact">
            {continueWatching.map((entry, index) => (
              <div key={`${entry.title.id}-${entry.episodeId ?? "main"}`} className="progress-card">
                <MediaCard item={entry.title} locale={locale} index={index} />
                <span className="progress-track" aria-hidden="true">
                  <span style={{ width: `${entry.progressPercent}%` }} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {home.sections.map((section, index) => (
        <div key={section.key} className={index === 0 && continueWatching.length === 0 ? "overlap-section" : undefined}>
          <ContentRow
            title={t(section.labelKey)}
            items={section.items}
            locale={locale}
            viewAllHref={
              section.key === "movies"
                ? "/movies"
                : section.key === "shows"
                  ? "/shows"
                  : section.key === "anime"
                    ? "/anime"
                    : "/search"
            }
            viewAllLabel={t("common.viewAll")}
          />
        </div>
      ))}

      <section className="content-section live-section">
        <div className="section-heading live-heading">
          <div>
            <span className="kicker">
              <span className="live-dot" /> {t("common.live")}
            </span>
            <h2>{t("home.liveNow")}</h2>
            <p>{t("home.liveSubtitle")}</p>
          </div>
        </div>
        <LiveExperience locale={locale} compact />
      </section>

      <GenreGrid locale={locale} genres={home.genres} />
    </main>
  );
}
