import { NextResponse } from "next/server";
import { getViewer } from "@/lib/profiles/server";
import { clearHistory, getHistory } from "@/lib/activity/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await getHistory(viewer.profile.id);
  return NextResponse.json({
    items: items.map((entry) => ({
      title: entry.title,
      episodeId: entry.episodeId,
      watchedAt: entry.watchedAt.toISOString(),
    })),
  });
}

export async function DELETE() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ok = await clearHistory(viewer.profile.id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
