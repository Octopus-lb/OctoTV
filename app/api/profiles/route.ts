import { NextResponse } from "next/server";
import { z } from "zod";
import { createProfile, listProfiles } from "@/lib/profiles/server";
import { getSession } from "@/lib/auth/server";
import { isLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(40),
  isKids: z.boolean().optional(),
  preferredLocale: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const profiles = await listProfiles(session.user.id);
  return NextResponse.json({
    profiles: profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      isKids: profile.isKids,
      preferredLocale: profile.preferredLocale,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const locale =
    parsed.data.preferredLocale && isLocale(parsed.data.preferredLocale)
      ? parsed.data.preferredLocale
      : undefined;

  const profile = await createProfile(session.user.id, parsed.data.name, {
    isKids: parsed.data.isKids,
    preferredLocale: locale,
  });
  if (!profile) {
    return NextResponse.json({ error: "profile_limit_or_unavailable" }, { status: 409 });
  }
  return NextResponse.json({ profile: { id: profile.id, name: profile.name } });
}
