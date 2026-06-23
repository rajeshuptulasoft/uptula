import i18n from './index';

export const getApiLanguage = () => i18n.language?.split('-')[0] || 'en';

export const getApiLanguageHeaders = () => ({
  'Accept-Language': getApiLanguage(),
  'X-App-Language': getApiLanguage(),
});

export const withLanguageParam = (url) => {
  if (!url || typeof url !== 'string') return url;
  const lang = getApiLanguage();
  if (url.includes('lang=')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}lang=${encodeURIComponent(lang)}`;
};
