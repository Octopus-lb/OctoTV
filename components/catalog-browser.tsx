"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, LoaderCircle, Search, X } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { useI18n } from "@/components/i18n-provider";
import type { CatalogPage, CatalogTitle, TitleType } from "@/lib/catalog/types";
import { localePath, type Locale } from "@/lib/i18n/config";

const SORTS = [
  { value: "popularity", key: "common.popularity" },
  { value: "rating", key: "common.rating" },
  { value: "newest", key: "common.newest" },
] as const;

export function CatalogBrowser({
  locale,
  type,
  initial,
  initialQuery = "",
  initialGenre = "",
  genres,
}: {
  locale: Locale;
  type?: TitleType;
  initial: CatalogPage;
  initialQuery?: string;
  initialGenre?: string;
  genres: string[];
}) {
  const { t, formatNumber } = useI18n();
  const [items, setItems] = useState<CatalogTitle[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState(initialGenre);
  const [sort, setSort] = useState("popularity");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const firstRender = useRef(true);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, index) => current - index);
  }, []);

  const load = useCallback(
    async (nextPage: number, signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ locale, page: String(nextPage) });
      if (type) params.set("type", type);
      if (query.trim()) params.set("q", query.trim());
      if (genre) params.set("genre", genre);
      if (sort) params.set("sort", sort);
      if (year) params.set("year", year);
      try {
        const response = await fetch(`/api/catalog?${params.toString()}`, { signal });
        if (!response.ok) throw new Error("catalog_unavailable");
        const data = (await response.json()) as CatalogPage;
        setItems(data.items);
        setPage(data.page);
        setTotalPages(Math.max(data.totalPages, 1));
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setError(t("common.loadFailed"));
        }
      } finally {
        setLoading(false);
      }
    },
    [genre, locale, query, sort, t, type, year],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(1, controller.signal), 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const hasFilters = Boolean(query || genre || year || sort !== "popularity");

  return (
    <section className="catalog-browser">
      <div className="filter-bar">
        <label className="search-field grow">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("common.searchPlaceholder")}
            aria-label={t("common.search")}
          />
          {query && (
            <button type="button" aria-label={t("common.clear")} onClick={() => setQuery("")}>
              <X size={15} />
            </button>
          )}
        </label>
        <button
          type="button"
          className={`filter-toggle${filtersOpen ? " active" : ""}`}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Filter size={16} /> {t("common.filters")}
        </button>
      </div>

      <div className={`filter-bar filter-advanced${filtersOpen ? " open" : ""}`}>
        <label>
          <span>{t("common.genres")}</span>
          <select value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">{t("common.all")}</option>
            {genres.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("common.year")}</span>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="">{t("common.all")}</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {formatNumber(value, { useGrouping: false })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("common.sort")}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            className="ghost-btn small"
            onClick={() => {
              setQuery("");
              setGenre("");
              setYear("");
              setSort("popularity");
            }}
          >
            <X size={14} /> {t("common.clear")}
          </button>
        )}
      </div>

      {loading && (
        <div className="catalog-loading" role="status">
          <LoaderCircle className="spin" size={16} /> {t("common.loading")}
        </div>
      )}
      {error && <div className="catalog-error" role="alert">{error}</div>}

      {!loading && items.length === 0 ? (
        <div className="empty-state">
          <Search size={26} />
          <strong>{t("catalog.noResults")}</strong>
          <p>{t("catalog.noResultsBody")}</p>
          <a className="ghost-btn" href={localePath(locale, type === "movie" ? "/movies" : type === "tv" ? "/shows" : "/anime")}>
            {t("common.clear")}
          </a>
        </div>
      ) : (
        <div className="media-grid">
          {items.map((item, index) => (
            <MediaCard key={item.id} item={item} locale={locale} index={index} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="ghost-btn small"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
          >
            {t("common.back")}
          </button>
          <span>{t("catalog.page", { page })}</span>
          <button
            type="button"
            className="ghost-btn small"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1)}
          >
            {t("common.continue")}
          </button>
        </div>
      )}
    </section>
  );
}
