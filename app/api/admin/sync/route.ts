import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/server";
import { runSyncJob } from "@/lib/admin/sync";

export const dynamic = "force-dynamic";

const schema = z.object({
  jobType: z.enum(["tmdb", "anilist", "iptv", "epg"]),
});

export async function POST(request: Request) {
  const { session, authorized } = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await runSyncJob(parsed.data.jobType, session.user.id);
  return NextResponse.json(result, {
    status: result.status === "failed" ? 502 : result.status === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
