import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { tryGetDb } from "@/db";
import { profilePreferences, profiles } from "@/db/schema";
import { getSession, type AuthSession } from "@/lib/auth/server";
import type { Profile } from "@/db/schema";

export const PROFILE_COOKIE = "octotv_profile";

export type Viewer = {
  session: AuthSession;
  profile: Profile;
};

export async function listProfiles(userId: string): Promise<Profile[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .orderBy(asc(profiles.createdAt));
  } catch {
    return [];
  }
}

export async function createProfile(
  userId: string,
  name: string,
  options: { isKids?: boolean; preferredLocale?: string } = {},
): Promise<Profile | null> {
  const db = tryGetDb();
  if (!db) return null;
  try {
    const existing = await listProfiles(userId);
    if (existing.length >= 5) return null;
    const id = crypto.randomUUID();
    const [profile] = await db
      .insert(profiles)
      .values({
        id,
        userId,
        name: name.trim().slice(0, 40) || "Profile",
        isKids: options.isKids ?? false,
        preferredLocale: options.preferredLocale ?? null,
      })
      .returning();
    if (!profile) return null;
    await db.insert(profilePreferences).values({ id: crypto.randomUUID(), profileId: profile.id });
    return profile;
  } catch {
    return null;
  }
}

export async function ensureProfile(userId: string, fallbackName: string): Promise<Profile | null> {
  const existing = await listProfiles(userId);
  if (existing.length) return selectProfileFromCookie(existing) ?? existing[0] ?? null;
  return createProfile(userId, fallbackName);
}

async function selectProfileFromCookie(list: Profile[]): Promise<Profile | null> {
  try {
    const cookieStore = await cookies();
    const id = cookieStore.get(PROFILE_COOKIE)?.value;
    if (id && list.some((profile) => profile.id === id)) {
      return list.find((profile) => profile.id === id) ?? null;
    }
  } catch {
    // cookies() is unavailable outside a request scope.
  }
  return null;
}

export async function getViewer(): Promise<Viewer | null> {
  const session = await getSession();
  if (!session) return null;
  const profile = await ensureProfile(session.user.id, session.user.name);
  if (!profile) return null;
  return { session, profile };
}
