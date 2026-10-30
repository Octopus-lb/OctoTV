import { notFound, redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { getWatchlist } from "@/lib/activity/repository";
import { getViewer } from "@/lib/profiles/server";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function WatchlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const viewer = await getViewer();
  if (!viewer) redirect(localePath(locale, "/auth/sign-in"));
  const { t } = createTranslator(locale);
  const items = await getWatchlist(viewer.profile.id);

  return (
    <main className="page">
      <header className="page-intro">
        <span className="kicker">{t("common.profile")}</span>
        <h1>{t("activity.watchlistTitle")}</h1>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={26} />
          <strong>{t("activity.watchlistEmpty")}</strong>
          <a href={localePath(locale, "/shows")} className="ghost-btn">
            {t("common.shows")}
          </a>
        </div>
      ) : (
        <div className="media-grid">
          {items.map((item, index) => (
            <MediaCard key={item.id} item={item} locale={locale} index={index} />
          ))}
        </div>
      )}
    </main>
  );
}
