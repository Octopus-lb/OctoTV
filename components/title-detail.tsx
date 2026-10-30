import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Film,
  Layers,
  Play,
  Star,
  Tv,
} from "lucide-react";
import { AddToListButton } from "@/components/add-to-list-button";
import { ContentRow } from "@/components/content-row";
import { DownloadButton } from "@/components/download-button";
import { PosterArt } from "@/components/poster-art";
import { WatchlistButton } from "@/components/watchlist-button";
import { titleBackdrop, tmdbImage } from "@/lib/catalog/images";
import { watchPath } from "@/lib/catalog/routes";
import type { CatalogDetail, TitleType } from "@/lib/catalog/types";
import { createTranslator } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

export function TitleDetailView({
  detail,
  locale,
  type,
  inWatchlist,
}: {
  detail: CatalogDetail;
  locale: Locale;
  type: TitleType;
  inWatchlist: boolean;
}) {
  const { t, formatDate, formatDuration, formatNumber } = createTranslator(locale);
  const backdrop = titleBackdrop(detail.backdropPath, detail.source);

  const facts = [
    detail.year ? String(detail.year) : null,
    detail.runtimeMinutes ? formatDuration(detail.runtimeMinutes) : null,
    detail.seasonCount
      ? `${formatNumber(detail.seasonCount)} ${t("catalog.seasons")}`
      : null,
    detail.episodeCount
      ? t("catalog.episodes", { count: detail.episodeCount })
      : null,
    detail.status,
  ].filter((value): value is string => Boolean(value));

  return (
    <main className="detail-page">
      <section
        className="detail-hero"
        style={
          backdrop
            ? ({ "--backdrop": `url(${backdrop})` } as React.CSSProperties)
            : undefined
        }
      >
        <div className="detail-backdrop" aria-hidden="true" />
        <div className="detail-content">
          <div className="detail-poster">
            <PosterArt title={detail} priority showTitle={false} />
          </div>
          <div className="detail-copy">
            <span className="kicker">
              {type === "movie"
                ? t("common.movies")
                : type === "tv"
                  ? t("common.shows")
                  : t("common.anime")}
              {detail.isDemo && <span className="demo-pill">{t("common.demo")}</span>}
            </span>
            <h1>{detail.title}</h1>
            {detail.tagline && <p className="tagline">{detail.tagline}</p>}

            <div className="detail-facts">
              {detail.voteAverage ? (
                <b>
                  <Star size={13} fill="currentColor" /> {detail.voteAverage.toFixed(1)}
                </b>
              ) : null}
              {facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>

            {detail.genres.length > 0 && (
              <div className="chip-row">
                {detail.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={localePath(
                      locale,
                      `${type === "movie" ? "/movies" : type === "tv" ? "/shows" : "/anime"}?genre=${encodeURIComponent(genre)}`,
                    )}
                    className="chip"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            <p className="detail-overview">{detail.overview}</p>

            <div className="detail-actions">
              <Link
                href={localePath(locale, watchPath(type, detail.id))}
                className="primary-btn"
              >
                <Play fill="currentColor" size={18} /> {t("common.watchNow")}
              </Link>
              <WatchlistButton
                titleId={detail.id}
                titleName={detail.title}
                initial={inWatchlist}
              />
              <AddToListButton locale={locale} titleId={detail.id} titleName={detail.title} />
              <DownloadButton contentId={detail.id} />
              {detail.trailerKey && (
                <a
                  className="ghost-btn"
                  href={`https://www.youtube.com/watch?v=${encodeURIComponent(detail.trailerKey)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Play size={18} /> {t("catalog.trailer")}
                </a>
              )}
            </div>

            {detail.isDemo && <p className="rights-note">{t("common.demoNotice")}</p>}
          </div>
        </div>
      </section>

      <section className="content-section detail-meta-grid">
        <div className="info-panel">
          <h2>{t("catalog.overview")}</h2>
          <dl>
            <div>
              <dt>
                <CalendarDays size={15} /> {t("catalog.releaseDate")}
              </dt>
              <dd>{detail.releaseDate ? formatDate(detail.releaseDate) : "—"}</dd>
            </div>
            <div>
              <dt>
                <Clock3 size={15} /> {t("catalog.runtime")}
              </dt>
              <dd>{detail.runtimeMinutes ? formatDuration(detail.runtimeMinutes) : "—"}</dd>
            </div>
            <div>
              <dt>
                <Layers size={15} /> {t("catalog.seasons")}
              </dt>
              <dd>{detail.seasonCount ?? "—"}</dd>
            </div>
            <div>
              <dt>
                <Film size={15} /> {t("catalog.originalLanguage")}
              </dt>
              <dd>{detail.originalLanguage?.toUpperCase() ?? "—"}</dd>
            </div>
          </dl>
        </div>

        {detail.cast.length > 0 && (
          <div className="info-panel">
            <h2>{t("catalog.cast")}</h2>
            <ul className="cast-list">
              {detail.cast.slice(0, 8).map((member) => {
                const image = tmdbImage(member.profilePath, "w185");
                return (
                  <li key={member.id}>
                    <span className="cast-avatar">
                      {image ? (
                        <img src={image} alt="" loading="lazy" decoding="async" />
                      ) : (
                        member.name.slice(0, 1)
                      )}
                    </span>
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.character ?? member.department}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {detail.seasons.length > 0 && (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="kicker">
                <Tv size={14} /> {t("common.shows")}
              </span>
              <h2>{t("catalog.seasons")}</h2>
            </div>
          </div>
          <div className="season-list">
            {detail.seasons.map((season) => (
              <details key={season.id} className="season-block" open={season.seasonNumber === 1}>
                <summary>
                  <span>
                    <strong>
                      {t("catalog.season", { number: season.seasonNumber })}
                    </strong>
                    <small>
                      {season.title} · {t("catalog.episodes", { count: season.episodes.length })}
                    </small>
                  </span>
                </summary>
                <div className="episode-grid">
                  {season.episodes.map((episode) => (
                    <Link
                      key={episode.id}
                      href={localePath(locale, watchPath(type, detail.id, episode.id))}
                      className="episode-card"
                    >
                      <span className="episode-number">
                        {String(episode.episodeNumber).padStart(2, "0")}
                      </span>
                      <span className="episode-copy">
                        <strong>
                          {t("catalog.episode", { number: episode.episodeNumber })}
                        </strong>
                        <small>
                          {episode.runtimeMinutes
                            ? formatDuration(episode.runtimeMinutes)
                            : episode.title}
                        </small>
                      </span>
                      <Play size={15} />
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <ContentRow
        title={t("catalog.recommendations")}
        items={detail.recommendations}
        locale={locale}
      />
    </main>
  );
}
