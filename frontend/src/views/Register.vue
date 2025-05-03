<template>
  <div class="register-container">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister" class="register-form">
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          type="text"
          id="name"
          v-model="name"
          required
          placeholder="Enter your name"
        />
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="Enter your email"
        />
      </div>
      <div class="form-group">
        <label for="username">Username:</label>
        <input
          type="text"
          id="username"
          v-model="username"
          required
          placeholder="Choose a username"
        />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="Enter your password"
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          required
          placeholder="Confirm your password"
        />
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Registering...' : 'Register' }}
      </button>
      <p class="login-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'RegisterPage',
  setup() {
    const store = useStore();
    const router = useRouter();
    const name = ref('');
    const email = ref('');
    const username = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const loading = ref(false);

    const handleRegister = async () => {
      error.value = '';

      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
      }

      loading.value = true;
      try {
        const result = await store.dispatch('register', {
          name: name.value,
          email: email.value,
          username: username.value,
          password: password.value,
        });

        if (result.success) {
          router.push('/dashboard');
        } else {
          error.value = result.error;
        }
      } catch (err) {
        error.value = 'An error occurred during registration';
      } finally {
        loading.value = false;
      }
    };

    return {
      name,
      email,
      username,
      password,
      confirmPassword,
      error,
      loading,
      handleRegister,
    };
  },
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.register-form {
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
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-bottom: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
}

.login-link a {
  color: #4caf50;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
