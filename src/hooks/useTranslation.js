import { useCallback, useSyncExternalStore } from 'react';
import i18n from '../i18n';

const subscribe = (callback) => {
  i18n.on('languageChanged', callback);
  return () => i18n.off('languageChanged', callback);
};

const getSnapshot = () => i18n.language;

/** Drop-in replacement for react-i18next useTranslation (powered by Google Translate). */
export const useTranslation = () => {
  const language = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const t = useCallback((key, options) => i18n.t(key, options), [language]);

  return {
    t,
    i18n: {
      language,
      changeLanguage: (code) => i18n.changeLanguage(code),
      isReady: i18n.isReady,
      isTranslating: i18n.isTranslating,
    },
  };
};
