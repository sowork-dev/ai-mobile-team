/**
 * AI Mobile Team - i18n Hook
 * 語言切換功能
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { locales, Locale, TranslationKeys } from "./locales";

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: "zh",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "ai-mobile-team-locale",
    }
  )
);

// Helper to get nested translation value
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) ?? path;
}

export function useI18n() {
  const { locale, setLocale } = useI18nStore();
  const translations = locales[locale];

  const t = (key: string): string => {
    return getNestedValue(translations, key);
  };

  const toggleLocale = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  return {
    locale,
    setLocale,
    toggleLocale,
    t,
    translations,
  };
}

export default useI18n;
