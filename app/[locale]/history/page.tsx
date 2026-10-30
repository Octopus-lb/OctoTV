import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { ClearHistoryButton } from "@/components/activity/clear-history-button";
import { MediaCard } from "@/components/media-card";
import { getHistory } from "@/lib/activity/repository";
import { getViewer } from "@/lib/profiles/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, "/auth/sign-in"));
  const { t, formatDate } = createTranslator(locale);
  const history = await getHistory(viewer.profile.id);

  return (
    <main className="page">
      <header className="page-intro with-action">
        <div>
          <span className="kicker">{t("common.profile")}</span>
          <h1>{t("activity.historyTitle")}</h1>
        </div>
        {history.length > 0 && <ClearHistoryButton />}
      </header>

      {history.length === 0 ? (
        <div className="empty-state">
          <Clock size={26} />
          <strong>{t("activity.historyEmpty")}</strong>
          <a href={localePath(locale, "/movies")} className="ghost-btn">
            {t("common.movies")}
          </a>
        </div>
      ) : (
        <div className="history-list">
          {history.map((entry, index) => (
            <div key={`${entry.title.id}-${entry.episodeId ?? "main"}`} className="history-row">
              <MediaCard item={entry.title} locale={locale} index={index} />
              <span className="history-date">{formatDate(entry.watchedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
