import { NextResponse } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/profiles/server";
import {
  addToCustomList,
  getCustomListItems,
  getCustomLists,
  removeFromCustomList,
} from "@/lib/activity/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  titleId: z.string().min(1).max(200),
  titleName: z.string().max(300).optional(),
});

async function ownsList(profileId: string, listId: string): Promise<boolean> {
  const lists = await getCustomLists(profileId);
  return lists.some((list) => list.id === listId);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const items = await getCustomListItems(viewer.profile.id, id);
  return NextResponse.json({ items });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await ownsList(viewer.profile.id, id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const ok = await addToCustomList(
    id,
    parsed.data.titleId,
    parsed.data.titleName,
  );
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await ownsList(viewer.profile.id, id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const ok = await removeFromCustomList(id, parsed.data.titleId);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
