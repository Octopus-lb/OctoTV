export const locales = ["ar", "en", "tr", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const LOCALE_COOKIE = "octotv_locale";

export const localeDirections: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
  tr: "ltr",
  fr: "ltr",
};

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  tr: "Türkçe",
  fr: "Français",
};

export const localeShortNames: Record<Locale, string> = {
  ar: "AR",
  en: "EN",
  tr: "TR",
  fr: "FR",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return localeDirections[locale];
}

export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value;
  if (typeof value === "string") {
    const base = value.toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

/** Picks the best supported locale from an Accept-Language header. */
export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of candidates) {
    const base = candidate.tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && isLocale(parts[1])) {
    parts[1] = locale;
    return parts.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}
