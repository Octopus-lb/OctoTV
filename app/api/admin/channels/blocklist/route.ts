import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { tryGetDb } from "@/db";
import { adminAuditLogs, channelBlocklist } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  iptvOrgId: z.string().min(1).max(200),
  reason: z.string().min(1).max(300),
});

export async function POST(request: Request) {
  const { session, authorized } = await requireAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!authorized) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const db = tryGetDb();
  if (!db) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });

  try {
    await db
      .insert(channelBlocklist)
      .values({
        id: crypto.randomUUID(),
        iptvOrgId: parsed.data.iptvOrgId,
        reason: parsed.data.reason,
        createdBy: session.user.id,
      })
      .onConflictDoNothing();
    await db.insert(adminAuditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "channels.block",
      targetType: "channel",
      targetId: parsed.data.iptvOrgId,
      metadataJson: { reason: parsed.data.reason },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "write_failed" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const { session, authorized } = await requireAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!authorized) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const db = tryGetDb();
  if (!db) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  try {
    await db
      .delete(channelBlocklist)
      .where(and(eq(channelBlocklist.iptvOrgId, parsed.data.iptvOrgId)));
    await db.insert(adminAuditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "channels.unblock",
      targetType: "channel",
      targetId: parsed.data.iptvOrgId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "write_failed" }, { status: 503 });
  }
}
