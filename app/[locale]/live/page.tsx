import { notFound } from "next/navigation";
import { LiveExperience } from "@/components/live/live-experience";
import { createTranslator } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { t } = createTranslator(locale);

  return (
    <main className="page live-page-shell">
      <header className="page-intro live-intro">
        <span className="kicker">
          <span className="live-dot" /> {t("common.live")}
        </span>
        <h1>{t("live.title")}</h1>
        <p>{t("live.subtitle")}</p>
        <p className="rights-note">{t("live.rightsNotice")}</p>
      </header>
      <LiveExperience locale={locale} />
    </main>
  );
}
