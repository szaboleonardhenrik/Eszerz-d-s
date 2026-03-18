"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import hu from "@/locales/hu";
import en from "@/locales/en";

export type Locale = "hu" | "en";

const dictionaries: Record<Locale, typeof hu> = { hu, en };

interface I18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nCtx = createContext<I18nContext>({
  locale: "hu",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("locale") as Locale) || "hu";
    }
    return "hu";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale];
      const keys = key.split(".");
      let val: unknown = dict;
      for (const k of keys) {
        val = (val as Record<string, unknown>)?.[k];
        if (val === undefined) return key;
      }
      if (typeof val !== "string") return key;
      if (params) {
        return val.replace(/\{\{(\w+)\}\}/g, (_, p) => String(params[p] ?? `{{${p}}}`));
      }
      return val;
    },
    [locale]
  );

  return (
    <I18nCtx.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}
