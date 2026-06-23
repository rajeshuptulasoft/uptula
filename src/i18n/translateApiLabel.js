import i18n, { getCurrentLanguage } from './index';
import { translateTextSync, translateTextLazy } from './googleTranslate';

const OTHER_HINTS = ['cook', 'security guard', 'security_guard', 'supervisor', 'plumber'];

export const normalizeLabelKey = (value) => {
  if (value == null) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const formatFallbackLabel = (value) => {
  if (!value) return i18n.t('common.na');
  return String(value)
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const trimmed = word.trim();
      if (trimmed.length <= 3) return trimmed.toUpperCase();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .join(' ');
};

/** Translate API labels via Google Translate (categories, subcategories, etc.). */
export const translateApiLabel = (value) => {
  if (value == null || String(value).trim() === '') {
    return i18n.t('common.na');
  }

  const raw = String(value).trim();
  const categoryLower = raw.toLowerCase().replace(/_/g, ' ');

  if (OTHER_HINTS.some((hint) => categoryLower.includes(hint))) {
    return i18n.t('apiData.categories.other');
  }

  if (categoryLower === 'other') {
    return i18n.t('apiData.categories.other');
  }

  const formatted = formatFallbackLabel(raw);
  const lang = getCurrentLanguage();

  if (lang === 'en') return formatted;

  const cached = translateTextSync(formatted, lang);
  if (cached) return cached;

  translateTextLazy(formatted, lang);
  return formatted;
};

export const translateCategoryName = (category) => translateApiLabel(category);

export const translateSubcategoryName = (name) => translateApiLabel(name);

export const translateRecordLabel = (item) => {
  if (!item) return i18n.t('common.na');
  const raw = item.name ?? item.label ?? item.title ?? item.category ?? '';
  return translateApiLabel(raw);
};
