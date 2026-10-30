import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/server";
import { createPlaybackSession } from "@/lib/playback/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  assetId: z.string().min(1).max(200),
  providerId: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  try {
    const sessionData = await createPlaybackSession(
      parsed.data.assetId,
      session.user.id,
      parsed.data.providerId,
    );
    return NextResponse.json({
      sessionId: sessionData.id,
      token: sessionData.token,
      expiresAt: sessionData.expiresAt,
      providerId: sessionData.providerId,
    });
  } catch {
    return NextResponse.json({ error: "session_unavailable" }, { status: 503 });
  }
}
