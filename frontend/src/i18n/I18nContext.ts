import { createContext } from 'react';
import type { AppLanguage } from './language';
import type { Translator } from './translate';

export type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: Translator;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
