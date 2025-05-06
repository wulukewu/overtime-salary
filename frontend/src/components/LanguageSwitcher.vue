<template>
  <div class="language-switcher">
    <button @click="toggleLanguage" class="language-toggle-btn">
      {{ currentLanguage === 'en' ? '繁體中文' : 'English' }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted, inject } from 'vue';

export default {
  name: 'LanguageSwitcher',
  setup() {
    const currentLanguage = ref('en');
    const i18n = inject('i18n');

    const toggleLanguage = () => {
      currentLanguage.value = currentLanguage.value === 'en' ? 'zh-TW' : 'en';
      localStorage.setItem('language', currentLanguage.value);
      document.documentElement.lang = currentLanguage.value;
      
      // Instead of reloading, update the language in the i18n system
      if (i18n) {
        i18n.setLanguage(currentLanguage.value);
      }
    };

    onMounted(() => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage) {
        currentLanguage.value = savedLanguage;
        document.documentElement.lang = savedLanguage;
        
        // Initialize with saved language
        if (i18n) {
          i18n.setLanguage(currentLanguage.value);
        }
      }
    });

    return {
      currentLanguage,
      toggleLanguage
    };
  }
};
</script>

<style scoped>
// ... existing code ...
</style>