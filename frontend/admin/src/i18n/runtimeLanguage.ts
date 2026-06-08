import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type AdminLanguage,
} from './language';

let currentLanguage: AdminLanguage = DEFAULT_LANGUAGE;

export function getStoredLanguage(): AdminLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function getCurrentLanguage(): AdminLanguage {
  return currentLanguage;
}

export function setCurrentLanguage(language: AdminLanguage) {
  currentLanguage = language;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}
