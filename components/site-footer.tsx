import Link from "next/link";
import { Brand } from "@/components/brand";
import { createTranslator } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

export function SiteFooter({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  return (
    <footer>
      <Brand locale={locale} />
      <p>{t("home.footerTagline")}</p>
      <div>
        <Link href={localePath(locale, "/movies")}>{t("common.movies")}</Link>
        <Link href={localePath(locale, "/shows")}>{t("common.shows")}</Link>
        <Link href={localePath(locale, "/anime")}>{t("common.anime")}</Link>
        <Link href={localePath(locale, "/live")}>{t("common.live")}</Link>
      </div>
      <div>
        <Link href={localePath(locale, "/legal/privacy")}>{t("common.privacy")}</Link>
        <Link href={localePath(locale, "/legal/terms")}>{t("common.terms")}</Link>
        <Link href={localePath(locale, "/legal/dmca")}>{t("common.dmca")}</Link>
        <Link href={localePath(locale, "/about/credits")}>{t("common.credits")}</Link>
      </div>
      <small>{t("home.copyright")}</small>
      <small>{t("legal.tmdbAttribution")}</small>
      <small>{t("legal.iptvAttribution")}</small>
    </footer>
  );
}
