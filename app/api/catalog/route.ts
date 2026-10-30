import { NextResponse } from "next/server";
import { listCatalog } from "@/lib/catalog/service";
import type { TitleType } from "@/lib/catalog/types";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

function parseType(value: string | null): TitleType | undefined {
  return value === "movie" || value === "tv" || value === "anime" ? value : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("locale");
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const yearParam = Number.parseInt(url.searchParams.get("year") ?? "", 10);
  const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const sortParam = url.searchParams.get("sort");

  const result = await listCatalog(
    {
      type: parseType(url.searchParams.get("type")),
      query: url.searchParams.get("q") ?? undefined,
      genre: url.searchParams.get("genre") ?? undefined,
      year: Number.isFinite(yearParam) ? yearParam : undefined,
      sort:
        sortParam === "rating" || sortParam === "newest" ? sortParam : "popularity",
      page: Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1,
      perPage: 24,
    },
    locale,
  );

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=120, s-maxage=600" },
  });
}
