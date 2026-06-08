import { createContext } from 'react';
import type { AdminLanguage } from './language';
import type { AdminTranslator } from './translate';

export type I18nContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  t: AdminTranslator;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
