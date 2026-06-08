import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, normalizeLanguage, type AppLanguage } from './language';

let currentLanguage: AppLanguage = DEFAULT_LANGUAGE;

export function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function getCurrentLanguage(): AppLanguage {
  return currentLanguage;
}

export function setCurrentLanguage(language: AppLanguage) {
  currentLanguage = language;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}
