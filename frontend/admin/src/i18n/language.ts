export const SUPPORTED_LANGUAGES = ['sl', 'en'] as const;

export type AdminLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AdminLanguage = 'sl';
export const LANGUAGE_STORAGE_KEY = 'feri.navigator.language';

export function normalizeLanguage(value: string | null | undefined): AdminLanguage {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('en')) {
    return 'en';
  }
  if (normalized.startsWith('sl')) {
    return 'sl';
  }

  return DEFAULT_LANGUAGE;
}
