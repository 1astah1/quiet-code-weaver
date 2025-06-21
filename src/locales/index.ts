
import { ru } from './ru';
import { en } from './en';
import { pl } from './pl';
import { pt } from './pt';
import { fr } from './fr';
import { de } from './de';
import { es } from './es';

export const translations = {
  ru,
  en,
  pl,
  pt,
  fr,
  de,
  es,
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof ru;
