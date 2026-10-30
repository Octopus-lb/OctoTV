import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { env as cloudflareEnv } from "cloudflare:workers";
import { getDb, tryGetDb } from "@/db";
import {
  accounts,
  adminUsers,
  profiles,
  sessions,
  users,
  verifications,
} from "@/db/schema";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { resetPasswordEmail, sendEmail, verificationEmail } from "./email";

const authSchema = {
  users,
  sessions,
  accounts,
  verifications,
};

let cachedAuth: ReturnType<typeof createAuthInstance> | null = null;

function userLocale(user: unknown): Locale {
  const value = (user as { preferredLocale?: string } | null)?.preferredLocale;
  return isLocale(value) ? value : "en";
}

function createAuthInstance() {
  const db = getDb();
  const secret = cloudflareEnv.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET is not configured. Add it to .dev.vars or Worker secrets.",
    );
  }

  const baseURL =
    cloudflareEnv.BETTER_AUTH_URL ||
    cloudflareEnv.APP_BASE_URL ||
    "http://localhost:5173";

  const googleConfigured = Boolean(
    cloudflareEnv.GOOGLE_CLIENT_ID && cloudflareEnv.GOOGLE_CLIENT_SECRET,
  );

  return betterAuth({
    appName: "OctoTV",
    secret,
    baseURL,
    basePath: "/api/auth",
    trustedOrigins: [baseURL],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
      usePlural: true,
    }),
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        preferredLocale: {
          type: "string",
          required: false,
          defaultValue: "ar",
        },
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, token }) => {
        const locale = userLocale(user);
        const url = `${baseURL}/${locale}/auth/reset-password?token=${encodeURIComponent(token)}`;
        const payload = resetPasswordEmail(url, locale);
        await sendEmail({ ...payload, to: user.email });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, token }) => {
        const locale = userLocale(user);
        const url = `${baseURL}/${locale}/auth/verify-email?token=${encodeURIComponent(token)}`;
        const payload = verificationEmail(url, locale);
        await sendEmail({ ...payload, to: user.email });
      },
    },
    socialProviders: googleConfigured
      ? {
          google: {
            clientId: cloudflareEnv.GOOGLE_CLIENT_ID as string,
            clientSecret: cloudflareEnv.GOOGLE_CLIENT_SECRET as string,
            prompt: "select_account",
          },
        }
      : {},
    account: {
      // Never merge accounts purely because email strings match. Better Auth
      // only links a social account when the signed-in user explicitly does so.
      accountLinking: {
        enabled: true,
        trustedProviders: [],
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
    },
    advanced: {
      useSecureCookies: baseURL.startsWith("https://"),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: baseURL.startsWith("https://"),
      },
    },
  });
}

export function getAuth() {
  if (!cachedAuth) cachedAuth = createAuthInstance();
  return cachedAuth;
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  preferredLocale?: string | null;
  role?: string | null;
};

export type AuthSession = {
  user: SessionUser;
  session: { id: string; expiresAt: Date; createdAt: Date; userId: string };
};

export async function getSession(): Promise<AuthSession | null> {
  try {
    const auth = getAuth();
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    return (session as AuthSession | null) ?? null;
  } catch (error) {
    console.error("[octotv:auth] getSession failed:", (error as Error).message);
    return null;
  }
}

export async function requireUser(): Promise<AuthSession | null> {
  return getSession();
}

export async function getActiveProfile(userId: string) {
  const db = tryGetDb();
  if (!db) return null;
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return profile ?? null;
  } catch {
    return null;
  }
}

export async function isAdminUser(user: SessionUser | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;
  const db = tryGetDb();
  if (!db) return false;
  try {
    const [row] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(
        and(eq(adminUsers.userId, user.id), eq(adminUsers.role, "admin")),
      )
      .limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<{
  session: AuthSession | null;
  authorized: boolean;
}> {
  const session = await getSession();
  return { session, authorized: await isAdminUser(session?.user ?? null) };
}

