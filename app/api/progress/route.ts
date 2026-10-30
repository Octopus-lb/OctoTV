import { NextResponse } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/profiles/server";
import { getContinueWatching, saveProgress } from "@/lib/activity/repository";

export const dynamic = "force-dynamic";

const progressSchema = z.object({
  titleId: z.string().min(1).max(200),
  titleName: z.string().max(300).optional(),
  typeHint: z.enum(["movie", "tv", "anime"]).optional(),
  episodeId: z.string().max(200).nullable().optional(),
  positionSeconds: z.number().min(0).max(86_400),
  durationSeconds: z.number().min(0).max(86_400).nullable().optional(),
  completed: z.boolean().optional(),
});

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = progressSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const saved = await saveProgress({
    profileId: viewer.profile.id,
    ...parsed.data,
  });

  return NextResponse.json({ saved }, { status: saved ? 200 : 503 });
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const items = await getContinueWatching(viewer.profile.id);
  return NextResponse.json({
    profileId: viewer.profile.id,
    items: items.map((entry) => ({
      ...entry,
      updatedAt: entry.updatedAt.toISOString(),
    })),
  });
}
