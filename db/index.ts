import { env as cloudflareEnv } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Returns the Drizzle client for the current Worker request.
 * Throws when the D1 binding is missing so callers can decide whether the
 * failure is fatal (write paths) or degradable (read paths).
 */
export function getDb(binding?: D1Database): AppDatabase {
  const database = binding ?? cloudflareEnv.DB;
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Configure the D1 database in vite.config.ts (local) or wrangler configuration (production).",
    );
  }
  return drizzle(database, { schema });
}

/** Returns null instead of throwing when D1 is not configured. */
export function tryGetDb(binding?: D1Database): AppDatabase | null {
  try {
    return getDb(binding);
  } catch {
    return null;
  }
}

export function hasDatabase(): boolean {
  return Boolean(cloudflareEnv.DB);
}

export { schema };
