import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { tryGetDb } from "@/db";
import { channels, epgPrograms } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = tryGetDb();
  if (!db) {
    return NextResponse.json({ channelId: id, now: null, next: [], source: "none" });
  }

  try {
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(eq(channels.iptvOrgId, decodeURIComponent(id)))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ channelId: id, now: null, next: [], source: "none" });
    }

    const programmes = await db
      .select()
      .from(epgPrograms)
      .where(
        and(
          eq(epgPrograms.channelId, channel.id),
          gte(epgPrograms.endsAt, new Date()),
        ),
      )
      .orderBy(epgPrograms.startsAt)
      .limit(6);

    const now = programmes.find(
      (programme) =>
        programme.startsAt.getTime() <= Date.now() &&
        programme.endsAt.getTime() >= Date.now(),
    );

    return NextResponse.json({
      channelId: id,
      now: now
        ? {
            title: now.title,
            description: now.description,
            startsAt: now.startsAt.toISOString(),
            endsAt: now.endsAt.toISOString(),
          }
        : null,
      next: programmes
        .filter((programme) => programme.id !== now?.id)
        .slice(0, 4)
        .map((programme) => ({
          title: programme.title,
          description: programme.description,
          startsAt: programme.startsAt.toISOString(),
          endsAt: programme.endsAt.toISOString(),
        })),
      source: "database",
    });
  } catch {
    return NextResponse.json({ channelId: id, now: null, next: [], source: "none" });
  }
}
