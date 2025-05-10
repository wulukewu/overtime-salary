<template>
  <div id="app">
    <nav :class="{ 'mobile-menu-open': isMobileMenuOpen }">
      <div class="nav-left">
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <router-link to="/" exact-active-class="no-active-style">
          <img src="@/assets/logo.png" alt="Logo" class="logo" />
        </router-link>
        <div class="nav-links">
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
              @click="toggleUserDropdown"
              @mouseover="!isMobile && (showDropdown = true)"
              @mouseleave="!isMobile && (showDropdown = false)"
            >
              {{ username }}
              <i class="dropdown-icon">▼</i>
            </span>
            <div
              class="dropdown-menu"
              v-show="showDropdown"
              @mouseover="!isMobile && (showDropdown = true)"
              @mouseleave="!isMobile && (showDropdown = false)"
            >
              <router-link to="/profile" @click="closeMobileMenu">{{
                $t('nav.profile')
              }}</router-link>
              <router-link to="/settings" @click="closeMobileMenu">{{
                $t('nav.settings')
              }}</router-link>
              <a @click="logout">{{ $t('nav.logout') }}</a>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="auth-links">
            <router-link to="/login" @click="closeMobileMenu">{{
              $t('nav.login')
            }}</router-link>
            <router-link to="/register" @click="closeMobileMenu">{{
              $t('nav.register')
            }}</router-link>
          </div>
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
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
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
    const isMobileMenuOpen = ref(false);
    const isMobile = ref(window.innerWidth <= 768);

    const username = computed(
      () => store.state.user?.name || store.state.user?.username || ''
    );

    const isAuthenticated = computed(() => store.state.token !== null);
    const isAdmin = computed(() => store.state.isAdmin);
    const notification = computed(() => store.state.notification);
    const currentLanguage = computed(() => locale.value);

    const toggleMobileMenu = () => {
      isMobileMenuOpen.value = !isMobileMenuOpen.value;
      if (!isMobileMenuOpen.value) {
        showDropdown.value = false;
      }
    };

    const closeMobileMenu = () => {
      isMobileMenuOpen.value = false;
      showDropdown.value = false;
    };

    const toggleUserDropdown = () => {
      if (isMobile.value) {
        showDropdown.value = !showDropdown.value;
      }
    };

    const handleResize = () => {
      isMobile.value = window.innerWidth <= 768;
      if (!isMobile.value) {
        isMobileMenuOpen.value = false;
      }
    };

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

    onMounted(() => {
      window.addEventListener('resize', handleResize);
      handleResize();
      fetchUserProfile();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });

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
      isMobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      toggleUserDropdown,
      isMobile,
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
  position: relative;
}

.nav-left,
.nav-right {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-links {
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

.logo {
  height: 44px;
  margin-right: 0;
  display: block;
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 21px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;
}

.mobile-menu-toggle span {
  width: 100%;
  height: 3px;
  background-color: #2c3e50;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.language-switcher {
  margin-right: 20px;
}

.lang-btn {
  background: none;
  border: 1px solid #2c3e50;
  cursor: pointer;
  color: #2c3e50;
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.lang-btn:hover {
  background-color: #e9ecef;
  border-color: #42b983;
  color: #42b983;
}

@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: flex;
  }

  nav {
    padding: 12px 16px;
  }

  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #f8f9fa;
    flex-direction: column;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .mobile-menu-open .nav-links {
    display: flex;
  }

  .nav-right {
    gap: 10px;
  }

  .auth-links {
    display: none;
  }

  .mobile-menu-open .auth-links {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    right: 0;
    background-color: #f8f9fa;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .user-dropdown {
    position: static;
  }

  .dropdown-menu {
    position: fixed;
    top: auto;
    right: 16px;
    left: 16px;
    width: auto;
  }

  .mobile-menu-open .mobile-menu-toggle span:first-child {
    transform: translateY(9px) rotate(45deg);
  }

  .mobile-menu-open .mobile-menu-toggle span:nth-child(2) {
    opacity: 0;
  }

  .mobile-menu-open .mobile-menu-toggle span:last-child {
    transform: translateY(-9px) rotate(-45deg);
  }

  .language-switcher {
    margin-right: 10px;
  }

  .lang-btn {
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  nav {
    padding: 8px 12px;
  }

  .logo {
    height: 36px;
  }

  .mobile-menu-toggle {
    width: 24px;
    height: 18px;
  }
}
</style>
