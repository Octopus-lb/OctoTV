import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getViewer } from "@/lib/profiles/server";
import { getPlaybackOptions } from "@/lib/playback/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const contentId = url.searchParams.get("contentId");
  if (!contentId) {
    return NextResponse.json({ error: "missing_content_id" }, { status: 400 });
  }

  // Open catalog titles (public domain / CC BY) and demo records are streamed
  // from their publisher without an account. Licensed providers still require
  // a session.
  const isPublic = contentId.startsWith("demo-") || contentId.startsWith("open-");
  const session = await getSession();
  if (!isPublic && !session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const viewer = isPublic ? null : await getViewer();
  const options = await getPlaybackOptions(contentId, viewer?.profile.id);

  return NextResponse.json(
    {
      contentId,
      servers: options.map((option) => ({
        id: option.server.id,
        displayName: option.server.displayName,
        providerId: option.providerId,
        region: option.server.region,
        priority: option.server.priority,
        availability: option.server.availability,
        supportedFormats: option.server.supportedFormats,
        supportedQualities: option.server.supportedQualities,
        lastHealthCheck: option.server.lastHealthCheck,
        error: option.server.error,
      })),
      options,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
