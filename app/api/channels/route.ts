import { NextResponse } from "next/server";
import { isNotNull } from "drizzle-orm";
import { tryGetDb } from "@/db";
import { channelBlocklist } from "@/db/schema";
import { loadChannels } from "@/lib/live/iptv";

export const dynamic = "force-dynamic";

async function blockedIds(): Promise<Set<string>> {
  const db = tryGetDb();
  if (!db) return new Set();
  try {
    const rows = await db
      .select({ iptvOrgId: channelBlocklist.iptvOrgId })
      .from(channelBlocklist)
      .where(isNotNull(channelBlocklist.iptvOrgId));
    return new Set(
      rows
        .map((row) => row.iptvOrgId)
        .filter((id): id is string => Boolean(id)),
    );
  } catch {
    return new Set();
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const list = url.searchParams.get("list");
  const page = Math.max(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get("limit") ?? "48", 10) || 48, 1),
    120,
  );

  const result = await loadChannels({
    playlist: list,
    limit,
    offset: (page - 1) * limit,
    filters: {
      country: url.searchParams.get("country") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
      blockedIds: await blockedIds(),
      includeNsfw: false,
    },
  });

  return NextResponse.json(
    {
      source: "IPTV-org",
      list: list ?? null,
      page,
      pageSize: limit,
      total: result.total,
      degraded: result.degraded,
      channels: result.channels,
      facets: result.facets,
      updatedAt: new Date().toISOString(),
      rightsNotice:
        "Public availability of an IPTV playlist does not establish redistribution rights.",
    },
    {
      headers: {
        "Cache-Control": result.degraded
          ? "public, max-age=120"
          : "public, max-age=600, s-maxage=1800",
      },
    },
  );
}
