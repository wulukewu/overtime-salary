import { ref, reactive, readonly } from 'vue';
import translations from './translations';

const currentLanguage = ref(localStorage.getItem('language') || 'en');
const translatedTexts = reactive({});

// Initialize translations
updateTranslations();

function updateTranslations() {
  const translationSet = translations[currentLanguage.value] || translations['en'];
  Object.keys(translationSet).forEach(key => {
    translatedTexts[key] = translationSet[key];
  });
}

export const i18n = {
  currentLanguage: readonly(currentLanguage),
  t: (key) => translatedTexts[key] || key,
  setLanguage: (lang) => {
    if (translations[lang]) {
      currentLanguage.value = lang;
      updateTranslations();
    }
  }
};