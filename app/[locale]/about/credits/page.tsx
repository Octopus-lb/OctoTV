import { notFound } from "next/navigation";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import Link from "next/link";

export default async function CreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { t } = createTranslator(locale);

  const sections = [
    { title: t("legal.tmdbAttribution"), href: "https://www.themoviedb.org/" },
    { title: t("legal.anilistAttribution"), href: "https://anilist.co/" },
    { title: t("legal.iptvAttribution"), href: "https://github.com/iptv-org" },
  ];

  return (
    <main className="page legal-page">
      <header className="page-intro">
        <span className="kicker">{t("common.credits")}</span>
        <h1>{t("legal.creditsTitle")}</h1>
        <p>{t("legal.demoNotice")}</p>
      </header>
      <div className="credits-grid">
        {sections.map((section) => (
          <a key={section.href} href={section.href} target="_blank" rel="noreferrer noopener" className="info-panel">
            <p>{section.title}</p>
            <span>{section.href}</span>
          </a>
        ))}
        <div className="info-panel">
          <h2>{t("common.terms")}</h2>
          <p>{t("legal.termsBody")}</p>
          <Link href={localePath(locale, "/legal/terms")} className="view-all">
            {t("common.terms")}
          </Link>
        </div>
      </div>
    </main>
  );
}
