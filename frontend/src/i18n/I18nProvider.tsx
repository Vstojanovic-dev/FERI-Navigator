import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { DEFAULT_LANGUAGE, type AppLanguage } from './language';
import { getStoredLanguage, setCurrentLanguage } from './runtimeLanguage';
import { I18nContext, type I18nContextValue } from './I18nContext';
import { translate } from './translate';

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      return getStoredLanguage();
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => translate(language, key, params),
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
