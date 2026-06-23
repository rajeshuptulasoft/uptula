import { useEffect, useRef } from 'react';
import i18n from '../i18n';

/** Re-run callback only when the app language code changes (not on every translation batch update). */
export const useLanguageRefresh = (callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let lastLang = i18n.language;

    const handler = () => {
      const lang = i18n.language;
      if (lang === lastLang) return;
      lastLang = lang;
      if (typeof callbackRef.current === 'function') {
        callbackRef.current();
      }
    };

    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);
};
