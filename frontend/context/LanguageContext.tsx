"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import mr from "../locales/mr.json";

type Locale = "en" | "hi" | "mr";
type Translations = typeof en;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Translations> = { en, hi, mr };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("pharmaguard_locale") as Locale;
    if (savedLocale && (savedLocale === "en" || savedLocale === "hi" || savedLocale === "mr")) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("pharmaguard_locale", newLocale);
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = translations[locale];

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      current = current[key];
    }

    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
