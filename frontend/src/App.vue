<template>
  <div id="app">
    <nav>
      <div class="nav-left">
        <router-link to="/" exact-active-class="no-active-style">
          <img src="@/assets/logo.png" alt="Logo" class="logo" />
        </router-link>
        <router-link to="/">{{ $t('nav.home') }}</router-link>
        <router-link to="/dashboard" v-if="isAuthenticated">{{
          $t('nav.dashboard')
        }}</router-link>
        <router-link to="/import-export" v-if="isAuthenticated">{{
          $t('nav.importExport')
        }}</router-link>
        <router-link to="/admin" v-if="isAdmin">{{
          $t('nav.adminPanel')
        }}</router-link>
      </div>
      <div class="nav-right">
        <div class="language-switcher">
          <button @click="toggleLanguage" class="lang-btn">
            {{ currentLanguage === 'en' ? 'English' : '中文' }}
          </button>
        </div>
        <template v-if="isAuthenticated">
          <div class="user-dropdown">
            <span
              class="username"
              @mouseover="showDropdown = true"
              @mouseleave="showDropdown = false"
            >
              {{ username }}
              <i class="dropdown-icon">▼</i>
            </span>
            <div
              class="dropdown-menu"
              v-show="showDropdown"
              @mouseover="showDropdown = true"
              @mouseleave="showDropdown = false"
            >
              <router-link to="/profile">{{ $t('nav.profile') }}</router-link>
              <router-link to="/settings">{{ $t('nav.settings') }}</router-link>
              <a @click="logout">{{ $t('nav.logout') }}</a>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login">{{ $t('nav.login') }}</router-link>
          <router-link to="/register">{{ $t('nav.register') }}</router-link>
        </template>
      </div>
    </nav>
    <router-view />
    <CustomNotification
      :show="notification.show"
      :message="notification.message"
      :duration="notification.duration"
      @close="hideNotification"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import config from './config';
import CustomNotification from './components/CustomNotification.vue';

export default {
  name: 'App',
  components: {
    CustomNotification,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { locale } = useI18n();
    const showDropdown = ref(false);
    const username = computed(
      () => store.state.user?.name || store.state.user?.username || ''
    );

    const isAuthenticated = computed(() => store.state.token !== null);
    const isAdmin = computed(() => store.state.isAdmin);
    const notification = computed(() => store.state.notification);
    const currentLanguage = computed(() => locale.value);

    const toggleLanguage = () => {
      const newLocale = locale.value === 'en' ? 'zh-TW' : 'en';
      locale.value = newLocale;
      localStorage.setItem('language', newLocale);
    };

    const hideNotification = () => {
      store.dispatch('notification/hideNotification');
    };

    const logout = () => {
      store.dispatch('logout');
      router.push('/login');
    };

    const fetchUserProfile = async () => {
      if (store.state.token && !store.state.user) {
        try {
          const response = await fetch(`${config.apiUrl}/api/users/profile`, {
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            store.commit('setUser', data);
            store.commit('setAdmin', data.is_admin);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    onMounted(fetchUserProfile);

    // Watch for token changes to fetch user profile
    watch(
      () => store.state.token,
      (newToken) => {
        if (newToken) {
          fetchUserProfile();
        }
      }
    );

    return {
      isAuthenticated,
      isAdmin,
      username,
      showDropdown,
      logout,
      notification,
      hideNotification,
      currentLanguage,
      toggleLanguage,
    };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-left,
.nav-right {
  display: flex;
  gap: 20px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: #e9ecef;
}

nav a.router-link-exact-active {
  color: #42b983;
  background-color: #e9ecef;
}

.user-dropdown {
  position: relative;
}

.username {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dropdown-icon {
  font-size: 12px;
  margin-left: 4px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  z-index: 1000;
}

.dropdown-menu a {
  display: block;
  padding: 8px 16px;
  text-align: left;
  color: #2c3e50;
  text-decoration: none;
  transition: background-color 0.3s;
}

.dropdown-menu a:hover {
  background-color: #f8f9fa;
}

.dropdown-menu a:last-child {
  border-top: 1px solid #e9ecef;
  color: #dc3545;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  height: 44px;
  margin-right: 0;
  display: block;
}

.no-active-style {
  background: none !important;
  color: inherit !important;
}

.language-switcher {
  margin-right: 20px;
}

.lang-btn {
  padding: 8px 16px;
  border: 1px solid #2c3e50;
  border-radius: 4px;
  background-color: transparent;
  color: #2c3e50;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.lang-btn:hover {
  background-color: #2c3e50;
  color: white;
}
</style>
