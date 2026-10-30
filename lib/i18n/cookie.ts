import type { Locale } from "./config";

const COOKIE_NAME = "octotv_locale";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persists the visitor's locale choice. Kept in a standalone helper so React
 * components never assign to `document` during render.
 */
export function persistLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}
