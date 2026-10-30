import Link from "next/link";
import { createTranslator } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

export default async function NotFound({
  params,
}: {
  params?: { locale?: string };
}) {
  const locale: Locale = params?.locale && isLocale(params.locale) ? params.locale : "en";
  const { t } = createTranslator(locale);
  return (
    <main className="page empty-page">
      <div className="empty-state">
        <span className="error-code">404</span>
        <strong>{t("common.notFound")}</strong>
        <p>{t("common.notFoundBody")}</p>
        <Link href={localePath(locale)} className="primary-btn">
          {t("common.goHome")}
        </Link>
      </div>
    </main>
  );
}
