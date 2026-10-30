import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth/server";
import { listProfiles, PROFILE_COOKIE } from "@/lib/profiles/server";

export const dynamic = "force-dynamic";

const schema = z.object({ profileId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const profiles = await listProfiles(session.user.id);
  if (!profiles.some((profile) => profile.id === parsed.data.profileId)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE, parsed.data.profileId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}
