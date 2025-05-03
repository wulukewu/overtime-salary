<template>
  <div id="app">
    <nav>
      <div class="nav-left">
        <router-link to="/">Home</router-link>
        <router-link to="/dashboard" v-if="isAuthenticated"
          >Dashboard</router-link
        >
      </div>
      <div class="nav-right">
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
              <router-link to="/profile">Profile</router-link>
              <router-link to="/settings">Settings</router-link>
              <a @click="logout">Logout</a>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Register</router-link>
        </template>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'App',
  setup() {
    const store = useStore();
    const router = useRouter();
    const showDropdown = ref(false);
    const username = ref('');

    const isAuthenticated = computed(() => store.state.token !== null);

    const logout = () => {
      store.dispatch('logout');
      router.push('/login');
    };

    const fetchUserProfile = async () => {
      if (store.state.token) {
        try {
          const response = await fetch(
            'http://localhost:3000/api/users/profile',
            {
              headers: {
                Authorization: `Bearer ${store.state.token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            username.value = data.email;
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    onMounted(fetchUserProfile);

    return {
      isAuthenticated,
      username,
      showDropdown,
      logout,
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
  padding: 30px;
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
</style>
