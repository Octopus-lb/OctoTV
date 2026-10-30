import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { tryGetDb } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth/server";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const schema = z.object({ locale: z.string() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isLocale(parsed.data.locale)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  const db = tryGetDb();
  if (db) {
    try {
      await db
        .update(users)
        .set({ preferredLocale: parsed.data.locale, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
    } catch {
      // The cookie still stores the preference for this browser.
    }
  }

  const response = NextResponse.json({ ok: true, locale: parsed.data.locale });
  response.cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
