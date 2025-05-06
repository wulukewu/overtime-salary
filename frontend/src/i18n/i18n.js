import translations from './translations';

export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'en';
};

export const translate = (key) => {
  const lang = getCurrentLanguage();
  const translationSet = translations[lang] || translations['en'];
  return translationSet[key] || key;
};

export const t = translate; // Shorthand for translate