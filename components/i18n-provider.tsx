"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { createTranslator, type Translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

const I18nContext = createContext<Translator | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(() => createTranslator(locale), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Translator {
  const translator = useContext(I18nContext);
  if (!translator) {
    throw new Error("useI18n must be used inside <I18nProvider>.");
  }
  return translator;
}
