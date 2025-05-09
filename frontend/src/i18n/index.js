import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zhTW from './locales/zh-TW';

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-TW': zhTW,
  },
});

export default i18n;
