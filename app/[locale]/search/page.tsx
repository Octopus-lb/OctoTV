import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/catalog-browser";
import { CATALOG_GENRES } from "@/lib/catalog/genres";
import { listCatalog } from "@/lib/catalog/service";
import { createTranslator } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { CatalogPage } from "@/lib/catalog/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { q } = await searchParams;
  const { t } = createTranslator(locale);

  const page: CatalogPage = q?.trim()
    ? await listCatalog({ query: q, perPage: 24 }, locale)
    : { items: [], page: 1, totalPages: 1, totalResults: 0, source: "demo" };

  return (
    <main className="page">
      <header className="page-intro">
        <span className="kicker">{t("common.search")}</span>
        <h1>{q?.trim() ? t("catalog.resultsFor", { query: q }) : t("catalog.searchTitle")}</h1>
        <p>{t("common.searchPlaceholder")}</p>
      </header>
      <CatalogBrowser
        locale={locale}
        initial={page}
        initialQuery={q ?? ""}
        genres={CATALOG_GENRES}
      />
    </main>
  );
}
