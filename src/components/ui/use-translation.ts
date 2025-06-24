import { useMemo } from "react";
import { translations, Language } from "@/locales";

export function useTranslation(languageCode?: string) {
  const lang: Language = (languageCode as Language) || "ru";
  const dict = translations[lang] || translations["ru"];

  const t = useMemo(() => {
    return (key: keyof typeof dict) => dict[key] || key;
  }, [dict]);

  return { t };
} 