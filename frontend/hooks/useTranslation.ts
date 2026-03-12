"use client";

import { useLanguage } from "../context/LanguageContext";

export function useTranslation() {
  const { t, locale, setLocale } = useLanguage();
  return { t, locale, setLocale };
}
