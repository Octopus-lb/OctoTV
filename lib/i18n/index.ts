import { ar } from "./messages/ar";
import { en } from "./messages/en";
import { fr } from "./messages/fr";
import { tr } from "./messages/tr";
import {
  defaultLocale,
  getDirection,
  type Locale,
} from "./config";

export type TranslatorVariables = Record<string, string | number>;

export type { MessageKey, Messages } from "./messages/en";

const dictionaries = { ar, en, tr, fr };
const fallback = en;

export { LOCALE_COOKIE } from "./config";

export function getMessages(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function interpolate(
  template: string,
  variables?: TranslatorVariables,
): string {
  if (!variables) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = variables[name];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(locale: Locale) {
  const messages = getMessages(locale);
  const fallbackMessages = getMessages(defaultLocale);

  const t = (
    key: keyof typeof fallback,
    variables?: TranslatorVariables,
  ): string => {
    const template =
      messages[key] ?? fallbackMessages[key] ?? (fallback[key] as string) ?? key;
    return interpolate(template, variables);
  };

  const tWithFallback = (key: keyof typeof fallback): string => fallback[key];

  return {
    locale,
    dir: getDirection(locale),
    t,
    /** English string, used for provider-facing labels and error codes. */
    fallback: tWithFallback,
    formatDate(
      value: Date | string | number,
      options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
    ): string {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(locale, options).format(date);
    },
    formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    formatDuration(minutes: number): string {
      if (!Number.isFinite(minutes) || minutes <= 0) return "";
      const hours = Math.floor(minutes / 60);
      const rest = Math.round(minutes % 60);
      if (hours <= 0) return t("catalog.minutes", { count: rest });
      const hourLabel = new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "hour",
        unitDisplay: "short",
      }).format(hours);
      const minuteLabel = new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "minute",
        unitDisplay: "short",
      }).format(rest);
      return `${hourLabel} ${minuteLabel}`;
    },
  };
}

export type Translator = ReturnType<typeof createTranslator>;
