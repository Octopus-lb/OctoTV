import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/catalog-browser";
import { CATALOG_GENRES } from "@/lib/catalog/genres";
import { listCatalog } from "@/lib/catalog/service";
import { createTranslator } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AnimePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ genre?: string; q?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { genre, q } = await searchParams;
  const { t } = createTranslator(locale);
  const page = await listCatalog({ type: "anime", genre, query: q, perPage: 24 }, locale);

  return (
    <main className="page">
      <header className="page-intro">
        <span className="kicker">{t("common.anime")}</span>
        <h1>{t("catalog.animeTitle")}</h1>
        <p>{t("catalog.animeSubtitle")}</p>
      </header>
      <CatalogBrowser
        locale={locale}
        type="anime"
        initial={page}
        initialQuery={q ?? ""}
        initialGenre={genre ?? ""}
        genres={CATALOG_GENRES}
      />
    </main>
  );
}
