import { notFound } from "next/navigation";
import { createTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import Link from "next/link";

const DOCS = {
  terms: { title: "legal.termsTitle", body: "legal.termsBody" },
  privacy: { title: "legal.privacyTitle", body: "legal.privacyBody" },
  dmca: { title: "legal.dmcaTitle", body: "legal.dmcaBody" },
} as const satisfies Record<string, { title: MessageKey; body: MessageKey }>;

type DocKey = keyof typeof DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale: raw, doc } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  if (!(doc in DOCS)) notFound();
  const entry = DOCS[doc as DocKey];
  const { t } = createTranslator(locale);

  return (
    <main className="page legal-page">
      <header className="page-intro">
        <span className="kicker">OctoTV</span>
        <h1>{t(entry.title)}</h1>
      </header>
      <article className="legal-body">
        <p>{t(entry.body)}</p>
        <p>{t("legal.demoNotice")}</p>
        <p>{t("legal.tmdbAttribution")}</p>
        <p>{t("legal.anilistAttribution")}</p>
        <p>{t("legal.iptvAttribution")}</p>
      </article>
      <nav className="legal-nav">
        <Link href={localePath(locale, "/legal/terms")}>{t("common.terms")}</Link>
        <Link href={localePath(locale, "/legal/privacy")}>{t("common.privacy")}</Link>
        <Link href={localePath(locale, "/legal/dmca")}>{t("common.dmca")}</Link>
        <Link href={localePath(locale, "/about/credits")}>{t("common.credits")}</Link>
      </nav>
    </main>
  );
}
