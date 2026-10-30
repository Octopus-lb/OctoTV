import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getDownloadAccess, getPlaybackOptions } from "@/lib/playback/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const contentId = url.searchParams.get("contentId");
  if (!contentId) {
    return NextResponse.json({ error: "missing_content_id" }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const options = await getPlaybackOptions(contentId);
  const downloads = [];
  for (const option of options) {
    if (!option.downloadAvailable) continue;
    const access = await getDownloadAccess(option.assetId, session.user.id, option.providerId);
    if (!access.allowed) continue;
    downloads.push({
      assetId: option.assetId,
      providerId: option.providerId,
      server: option.server.displayName,
      quality: access.quality,
      format: access.format,
      url: access.url,
      expiresAt: access.expiresAt,
    });
  }

  return NextResponse.json(
    { contentId, downloads },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
