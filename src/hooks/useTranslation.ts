
import { translations, Language, TranslationKey } from '../locales';

export const useTranslation = (language: string = 'ru') => {
  const lang = (language as Language) || 'ru';
  const currentTranslations = translations[lang] || translations.ru;

  const t = (key: TranslationKey): string => {
    return currentTranslations[key] || translations.ru[key] || key;
  };

  return { t, currentLanguage: lang };
};
