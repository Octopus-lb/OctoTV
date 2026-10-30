import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { tryGetDb } from "@/db";
import { profiles } from "@/db/schema";
import { getSession } from "@/lib/auth/server";
import { PROFILE_COOKIE } from "@/lib/profiles/server";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  isKids: z.boolean().optional(),
  avatar: z.string().max(200).nullable().optional(),
});

async function ownedProfile(userId: string, id: string) {
  const db = tryGetDb();
  if (!db) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
    .limit(1);
  return profile ?? null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const existing = await ownedProfile(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const db = tryGetDb();
  if (!db) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  await db
    .update(profiles)
    .set({
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.isKids !== undefined ? { isKids: parsed.data.isKids } : {}),
      ...(parsed.data.avatar !== undefined ? { avatar: parsed.data.avatar } : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const existing = await ownedProfile(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const remaining = await ownedProfile(session.user.id, id);
  if (!remaining) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const db = tryGetDb();
  if (!db) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });

  const count = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));
  if (count.length <= 1) {
    return NextResponse.json({ error: "last_profile" }, { status: 409 });
  }

  await db.delete(profiles).where(eq(profiles.id, id));
  const cookieStore = await cookies();
  if (cookieStore.get(PROFILE_COOKIE)?.value === id) {
    cookieStore.delete(PROFILE_COOKIE);
  }
  return NextResponse.json({ ok: true });
}
