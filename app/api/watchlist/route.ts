import { NextResponse } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/profiles/server";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/activity/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  titleId: z.string().min(1).max(200),
  titleName: z.string().max(300).optional(),
});

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await getWatchlist(viewer.profile.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const ok = await addToWatchlist(
    viewer.profile.id,
    parsed.data.titleId,
    parsed.data.titleName,
  );
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}

export async function DELETE(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const ok = await removeFromWatchlist(viewer.profile.id, parsed.data.titleId);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
