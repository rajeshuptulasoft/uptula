import en from './locales/en.json';
import { INDIAN_LANGUAGES } from './languages';
import { getStringByKey, storeStringByKey } from '../utils/Storage';
import {
  translateBatch,
  loadPersistedCatalog,
  persistCatalog,
  primeCacheFromCatalog,
} from './googleTranslate';

export const APP_LANGUAGE_KEY = 'appLanguage';

const flatten = (obj, prefix = '') => {
  const result = {};
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v, key));
    } else {
      result[key] = String(v);
    }
  });
  return result;
};

const englishCatalog = flatten(en);

let currentLanguage = 'en';
let translatedCatalog = {};
let isTranslating = false;
const listeners = new Map();

const interpolate = (template, options = {}) => {
  if (!options || typeof options !== 'object') return template;
  return Object.entries(options).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v ?? '')),
    template
  );
};

const getEnglishValue = (key, options = {}) => {
  const english = englishCatalog[key] ?? options.defaultValue ?? key;
  return interpolate(english, options);
};

const emit = (event) => {
  (listeners.get(event) || []).forEach((handler) => {
    try {
      handler();
    } catch (_) {
      /* ignore */
    }
  });
};

export const i18nEngine = {
  language: 'en',
  isReady: false,
  isTranslating: false,

  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(handler);
  },

  off(event, handler) {
    const list = listeners.get(event) || [];
    listeners.set(
      event,
      list.filter((h) => h !== handler)
    );
  },

  t(key, options = {}) {
    if (currentLanguage === 'en') {
      return getEnglishValue(key, options);
    }

    const englishInterpolated = getEnglishValue(key, options);
    const englishTemplate = englishCatalog[key];

    if (options && Object.keys(options).length > 0 && englishTemplate) {
      const translatedTemplate = translatedCatalog[key];
      if (translatedTemplate) {
        return interpolate(translatedTemplate, options);
      }
      return englishInterpolated;
    }

    return translatedCatalog[key] ?? englishInterpolated;
  },

  async applyLanguage(langCode, { persist = true, background = false } = {}) {
    if (!INDIAN_LANGUAGES.some((l) => l.code === langCode)) {
      return false;
    }

    if (persist) {
      await storeStringByKey(APP_LANGUAGE_KEY, langCode);
    }

    currentLanguage = langCode;
    this.language = langCode;

    if (langCode === 'en') {
      translatedCatalog = {};
      this.isTranslating = false;
      this.isReady = true;
      emit('languageChanged');
      return true;
    }

    const persisted = await loadPersistedCatalog(langCode);
    if (persisted && Object.keys(persisted).length > 0) {
      translatedCatalog = persisted;
      primeCacheFromCatalog(langCode, persisted, englishCatalog);
      this.isTranslating = false;
      this.isReady = true;
      emit('languageChanged');
      return true;
    }

    // No cache yet — use English immediately, translate in background (don't block splash).
    translatedCatalog = {};
    this.isTranslating = !background;
    this.isReady = true;
    emit('languageChanged');

    if (background) {
      this.translateCatalogInBackground(langCode);
      return true;
    }

    return this.translateCatalogInBackground(langCode);
  },

  async translateCatalogInBackground(langCode) {
    this.isTranslating = true;
    isTranslating = true;
    emit('languageChanged');

    const entries = Object.entries(englishCatalog);
    const priorityPrefixes = [
      'home.', 'register.', 'splash.', 'tabs.', 'header.', 'drawer.', 'common.', 'login.',
      'aboutUs.', 'reportIssue.', 'changePassword.', 'notifications.', 'jobDetails.',
      'userProfile.', 'profile.', 'companyDetails.', 'displayCompanyProfile.',
      'recommendedJob.', 'userSearchJob.', 'createResume.', 'mockInterview.',
      'providerProfile.', 'editCompanyProfile.', 'viewCandidate.', 'booleanSearch.',
      'appliedJobs.', 'wishlist.', 'chat.',
    ];
    const priorityEntries = entries.filter(([key]) =>
      priorityPrefixes.some((prefix) => key.startsWith(prefix))
    );
    const otherEntries = entries.filter(([key]) =>
      !priorityPrefixes.some((prefix) => key.startsWith(prefix))
    );

    const translateEntries = async (list) => {
      if (!list.length) return;
      const texts = list.map(([, value]) => value);
      const translatedTexts = await translateBatch(texts, langCode, 'en');
      list.forEach(([key], index) => {
        translatedCatalog[key] = translatedTexts[index] || englishCatalog[key];
      });
    };

    try {
      await translateEntries(priorityEntries);
      emit('languageChanged');
      await translateEntries(otherEntries);
      await persistCatalog(langCode, { ...translatedCatalog });
      primeCacheFromCatalog(langCode, translatedCatalog, englishCatalog);
    } catch {
      translatedCatalog = {};
    }

    this.isTranslating = false;
    isTranslating = false;
    this.isReady = true;
    emit('languageChanged');
    return true;
  },
};

export const getCurrentLanguage = () => currentLanguage;
export const getIsTranslating = () => isTranslating;
export const getEnglishCatalog = () => englishCatalog;
