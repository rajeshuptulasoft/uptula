/**
 * Google Translate — no i18next / react-i18next.
 * Uses Google Cloud Translation API when GOOGLE_TRANSLATE_API_KEY is set,
 * otherwise falls back to the public translate endpoint.
 */

import { getStringByKey, storeStringByKey } from '../utils/Storage';

// Optional: add your Google Cloud Translation API key here for production use.
export const GOOGLE_TRANSLATE_API_KEY = '';

const memoryCache = new Map();
const dynamicListeners = new Set();

const cacheKey = (lang, text) => `${lang}::${text}`;

export const subscribeDynamicTranslation = (listener) => {
  dynamicListeners.add(listener);
  return () => dynamicListeners.delete(listener);
};

const notifyDynamicListeners = () => {
  dynamicListeners.forEach((fn) => {
    try {
      fn();
    } catch (_) {
      /* ignore */
    }
  });
};

const protectPlaceholders = (text) => {
  const placeholders = [];
  const protectedText = String(text).replace(/\{\{(\w+)\}\}/g, (match) => {
    const index = placeholders.length;
    placeholders.push(match);
    return `__PH${index}__`;
  });
  return { protectedText, placeholders };
};

const restorePlaceholders = (text, placeholders) => {
  let result = String(text);
  placeholders.forEach((ph, index) => {
    result = result.replace(`__PH${index}__`, ph);
    result = result.replace(` __PH${index}__ `, ph);
    result = result.replace(new RegExp(`__PH${index}__`, 'g'), ph);
  });
  return result;
};

const parseGtxResponse = (data) => {
  if (!Array.isArray(data?.[0])) return '';
  return data[0].map((part) => part?.[0] ?? '').join('');
};

export const fetchGoogleTranslate = async (text, targetLang, sourceLang = 'en') => {
  if (!text?.trim()) return text;
  if (targetLang === 'en' || targetLang === sourceLang) return text;

  const { protectedText, placeholders } = protectPlaceholders(text);

  if (GOOGLE_TRANSLATE_API_KEY) {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: protectedText,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      }
    );
    const json = await response.json();
    const translated = json?.data?.translations?.[0]?.translatedText ?? protectedText;
    return restorePlaceholders(translated, placeholders);
  }

  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${encodeURIComponent(sourceLang)}` +
    `&tl=${encodeURIComponent(targetLang)}` +
    `&dt=t&q=${encodeURIComponent(protectedText)}`;

  const response = await fetch(url);
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return protectedText;
  }
  const translated = parseGtxResponse(data) || protectedText;
  return restorePlaceholders(translated, placeholders);
};

export const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text?.trim() || targetLang === 'en') return text;

  const key = cacheKey(targetLang, text);
  if (memoryCache.has(key)) return memoryCache.get(key);

  try {
    const translated = await fetchGoogleTranslate(text, targetLang, sourceLang);
    memoryCache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
};

/** Returns cached translation only (sync, for render). */
export const translateTextSync = (text, targetLang) => {
  if (!text?.trim() || targetLang === 'en') return text;
  return memoryCache.get(cacheKey(targetLang, text)) ?? null;
};

/** Translate on demand; updates cache and notifies listeners when done. */
export const translateTextLazy = async (text, targetLang) => {
  if (!text?.trim() || targetLang === 'en') return text;

  const cached = translateTextSync(text, targetLang);
  if (cached) return cached;

  const translated = await translateText(text, targetLang);
  notifyDynamicListeners();
  return translated;
};

export const translateBatch = async (texts, targetLang, sourceLang = 'en') => {
  if (targetLang === 'en') return texts;

  const chunkSize = 8;
  const results = [];

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((text) => translateText(text, targetLang, sourceLang))
    );
    results.push(...chunkResults);
  }

  return results;
};

const CATALOG_CACHE_PREFIX = 'googleTranslate_catalog_';

export const loadPersistedCatalog = async (lang) => {
  try {
    const raw = await getStringByKey(`${CATALOG_CACHE_PREFIX}${lang}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const persistCatalog = async (lang, catalog) => {
  try {
    await storeStringByKey(`${CATALOG_CACHE_PREFIX}${lang}`, JSON.stringify(catalog));
  } catch {
    /* ignore */
  }
};

export const primeCacheFromCatalog = (lang, catalog, englishCatalog = {}) => {
  if (!catalog || lang === 'en') return;
  Object.entries(catalog).forEach(([key, translated]) => {
    const english = englishCatalog[key];
    if (english && translated) {
      memoryCache.set(cacheKey(lang, english), translated);
    }
  });
};
