import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { env as cloudflareEnv } from "cloudflare:workers";
import { tryGetDb } from "@/db";
import { downloadAssets, downloadEvents } from "@/db/schema";
import { verifyToken } from "@/lib/playback/token";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const secret = cloudflareEnv.BETTER_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const verified = await verifyToken(token, secret);
  if (!verified.valid) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 403 });
  }
  if (verified.payload.scope !== "download") {
    return NextResponse.json({ error: "invalid_scope" }, { status: 403 });
  }

  const db = tryGetDb();
  if (!db) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });

  const [asset] = await db
    .select()
    .from(downloadAssets)
    .where(eq(downloadAssets.id, verified.payload.sub))
    .limit(1);

  if (!asset || !asset.downloadAllowed || !asset.rightsVerified || !asset.fileUrl) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  let target: URL;
  try {
    target = new URL(asset.fileUrl);
  } catch {
    return NextResponse.json({ error: "invalid_asset" }, { status: 502 });
  }
  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "invalid_protocol" }, { status: 502 });
  }

  const upstream = await fetch(target, { signal: AbortSignal.timeout(30_000) });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  }

  const userId = typeof verified.payload.userId === "string" ? verified.payload.userId : null;
  if (userId) {
    await db
      .insert(downloadEvents)
      .values({ id: crypto.randomUUID(), userId, downloadAssetId: asset.id })
      .catch(() => undefined);
  }

  const filename = `octotv-${asset.id}.${asset.format || "mp4"}`;
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
