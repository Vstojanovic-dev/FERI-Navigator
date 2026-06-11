import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { DEFAULT_LANGUAGE, type AppLanguage } from './language';
import { getStoredLanguage, setCurrentLanguage } from './runtimeLanguage';
import { I18nContext, type I18nContextValue } from './I18nContext';
import { translate } from './translate';

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const stored = getStoredLanguage();
      setCurrentLanguage(stored);
      return stored;
    } catch {
      setCurrentLanguage(DEFAULT_LANGUAGE);
      return DEFAULT_LANGUAGE;
    }
  });

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === 'sl' ? 'en' : 'sl'));
  }, []);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      languageButtonLabel: language === 'sl' ? 'EN' : 'SLO',
      t: (key, params) => translate(language, key, params),
    }),
    [language, setLanguage, toggleLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
