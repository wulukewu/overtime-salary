<template>
  <div class="login-container">
    <h2>Login</h2>
    <form class="login-form" @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="login">Username or Email</label>
        <input
          type="text"
          id="login"
          v-model="login"
          required
          placeholder="Enter your username or email"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="Enter your password"
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <p class="register-link">
      Don't have an account? <router-link to="/register">Register</router-link>
    </p>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginPage',
  setup() {
    const store = useStore();
    const router = useRouter();
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
          alert(result.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
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
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #4caf50;
}

button {
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-bottom: 1rem;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.register-link a {
  color: #4caf50;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}
</style>
