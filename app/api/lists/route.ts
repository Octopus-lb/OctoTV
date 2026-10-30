import { NextResponse } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/profiles/server";
import { createCustomList, getCustomLists } from "@/lib/activity/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
});

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const lists = await getCustomLists(viewer.profile.id);
  return NextResponse.json({
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      isPublic: list.isPublic,
      updatedAt: list.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const id = await createCustomList(
    viewer.profile.id,
    parsed.data.name,
    parsed.data.description,
  );
  if (!id) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  return NextResponse.json({ id });
}
