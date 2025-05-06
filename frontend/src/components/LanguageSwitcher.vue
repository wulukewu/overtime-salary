<template>
  <div class="language-switcher">
    <button @click="toggleLanguage" class="language-toggle-btn">
      {{ currentLanguage === 'en' ? '繁體中文' : 'English' }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'LanguageSwitcher',
  setup() {
    const currentLanguage = ref('en');

    const toggleLanguage = () => {
      currentLanguage.value = currentLanguage.value === 'en' ? 'zh-TW' : 'en';
      localStorage.setItem('language', currentLanguage.value);
      document.documentElement.lang = currentLanguage.value;
      window.location.reload(); // Reload to apply translations
    };

    onMounted(() => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage) {
        currentLanguage.value = savedLanguage;
        document.documentElement.lang = savedLanguage;
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
.language-switcher {
  margin-left: 15px;
}

.language-toggle-btn {
  background-color: transparent;
  border: 1px solid #4caf50;
  color: #4caf50;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.language-toggle-btn:hover {
  background-color: #4caf50;
  color: white;
}
</style>