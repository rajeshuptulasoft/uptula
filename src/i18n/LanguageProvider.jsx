import React, { useEffect, useReducer } from 'react';
import i18n from './index';
import { subscribeDynamicTranslation } from './googleTranslate';

/** Forces re-render when Google translations update. */
export const LanguageProvider = ({ children }) => {
  const [, refresh] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    const onLanguageChange = () => refresh();
    i18n.on('languageChanged', onLanguageChange);
    const unsubscribeDynamic = subscribeDynamicTranslation(onLanguageChange);
    return () => {
      i18n.off('languageChanged', onLanguageChange);
      unsubscribeDynamic();
    };
  }, []);

  return children;
};
