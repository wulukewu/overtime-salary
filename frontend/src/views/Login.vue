<template>
  <div class="login-container">
    <h2>{{ $t('auth.login') }}</h2>
    <form class="login-form" @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="login">{{ $t('auth.username') }}</label>
        <input
          type="text"
          id="login"
          v-model="login"
          required
          :placeholder="$t('auth.username')"
        />
      </div>
      <div class="form-group">
        <label for="password">{{ $t('auth.password') }}</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          :placeholder="$t('auth.password')"
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? $t('common.loading') : $t('auth.login') }}
      </button>
    </form>
    <p class="register-link">
      {{ $t('auth.noAccount') }}
      <router-link to="/register">{{ $t('auth.register') }}</router-link>
    </p>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

export default {
  name: 'LoginPage',
  setup() {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    const loginInput = ref('');
    const password = ref('');
    const loading = ref(false);

    const handleLogin = async () => {
      loading.value = true;
      try {
        const result = await store.dispatch('login', {
          login: loginInput.value,
          password: password.value,
        });

        if (result.success) {
          router.push('/dashboard');
        } else {
          console.error('Login failed:', result.error);
          store.dispatch('notification/showNotification', {
            message: result.error || t('auth.loginFailed'),
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        store.dispatch('notification/showNotification', {
          message: t('auth.loginFailed'),
          duration: 3000,
        });
      } finally {
        loading.value = false;
      }
    };

    return {
      login: loginInput,
      password,
      loading,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 40px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #42b983;
}

button {
  padding: 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3aa876;
}

button:disabled {
  background-color: #a8d5c2;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-bottom: 20px;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #6c757d;
}

.register-link a {
  color: #42b983;
  text-decoration: none;
}

@media (max-width: 480px) {
  .login-container {
    margin: 20px;
    padding: 20px;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  input {
    padding: 10px;
    font-size: 14px;
  }

  button {
    padding: 10px;
    font-size: 14px;
  }
}
</style>
