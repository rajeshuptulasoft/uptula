import { getStringByKey } from '../utils/Storage';
import { INDIAN_LANGUAGES } from './languages';
import { i18nEngine, APP_LANGUAGE_KEY } from './engine';

let languageReadyPromise = null;

/** Resolves once saved app language is applied (call before splash animation). */
export const ensureLanguageLoaded = () => {
  if (!languageReadyPromise) {
    languageReadyPromise = (async () => {
      const savedLang = await getStringByKey(APP_LANGUAGE_KEY);
      const lang = savedLang && INDIAN_LANGUAGES.some((l) => l.code === savedLang)
        ? savedLang
        : 'en';
      // Fast startup: never block splash on full Google Translate batch.
      await i18nEngine.applyLanguage(lang, { persist: false, background: true });
      return i18nEngine.language;
    })();
  }
  return languageReadyPromise;
};

ensureLanguageLoaded();

export const changeAndSaveLanguage = async (langCode) => {
  return i18nEngine.applyLanguage(langCode, { persist: true });
};

const i18n = {
  get language() {
    return i18nEngine.language;
  },
  get isReady() {
    return i18nEngine.isReady;
  },
  get isTranslating() {
    return i18nEngine.isTranslating;
  },
  t: (key, options) => i18nEngine.t(key, options),
  changeLanguage: (langCode) => i18nEngine.applyLanguage(langCode, { persist: true }),
  on: (event, handler) => i18nEngine.on(event, handler),
  off: (event, handler) => i18nEngine.off(event, handler),
};

export { getCurrentLanguage } from './engine';
export default i18n;
