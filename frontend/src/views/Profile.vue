<template>
  <div class="profile-container">
    <h1>{{ $t('profile.title') }}</h1>
    <div class="profile-content">
      <div class="profile-section">
        <h2>{{ $t('profile.updateProfile') }}</h2>
        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-group">
            <label for="name">{{ $t('profile.name') }}:</label>
            <input
              type="text"
              id="name"
              v-model="name"
              required
              :placeholder="$t('profile.enterName')"
            />
          </div>
          <div class="form-group">
            <label for="email">{{ $t('profile.email') }}:</label>
            <input
              type="email"
              id="email"
              v-model="email"
              required
              :placeholder="$t('profile.enterEmail')"
            />
          </div>
          <div class="form-group">
            <label for="username">{{ $t('profile.username') }}:</label>
            <input type="text" id="username" v-model="username" disabled />
          </div>
          <button type="submit" :disabled="saving">
            {{ saving ? $t('profile.saving') : $t('profile.save') }}
          </button>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">
            {{ $t('profile.success') }}
          </div>
        </form>
      </div>

      <div class="password-section">
        <h2>{{ $t('profile.changePassword') }}</h2>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label for="currentPassword"
              >{{ $t('profile.currentPassword') }}:</label
            >
            <input
              type="password"
              id="currentPassword"
              v-model="currentPassword"
              required
              :placeholder="$t('profile.enterCurrentPassword')"
            />
          </div>
          <div class="form-group">
            <label for="newPassword">{{ $t('profile.newPassword') }}:</label>
            <input
              type="password"
              id="newPassword"
              v-model="newPassword"
              required
              :placeholder="$t('profile.enterNewPassword')"
            />
          </div>
          <button type="submit" :disabled="changingPassword">
            {{
              changingPassword
                ? $t('profile.changing')
                : $t('profile.changePassword')
            }}
          </button>
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
          <div v-if="passwordSuccess" class="success-message">
            {{ $t('profile.passwordChanged') }}
          </div>
        </form>
      </div>

      <div class="delete-section">
        <h2>{{ $t('profile.deleteAccount') }}</h2>
        <button @click="deleteAccount" :disabled="deleting" class="delete-btn">
          {{ deleting ? $t('profile.deleting') : $t('profile.deleteAccount') }}
        </button>
        <div v-if="deleteError" class="error-message">{{ deleteError }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import config from '../config';

export default {
  name: 'UserProfile',
  setup() {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    const name = ref('');
    const email = ref('');
    const username = ref('');
    const currentPassword = ref('');
    const newPassword = ref('');
    const saving = ref(false);
    const changingPassword = ref(false);
    const deleting = ref(false);
    const error = ref('');
    const success = ref(false);
    const passwordError = ref('');
    const passwordSuccess = ref(false);
    const deleteError = ref('');

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t('profile.error'));
        }

        const data = await response.json();
        name.value = data.name;
        email.value = data.email;
        username.value = data.username;
      } catch (err) {
        error.value = err.message;
      }
    };

    const updateProfile = async () => {
      saving.value = true;
      error.value = '';
      success.value = false;

      try {
        const response = await fetch(`${config.apiUrl}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${store.state.token}`,
          },
          body: JSON.stringify({
            name: name.value,
            email: email.value,
          }),
        });

        if (!response.ok) {
          throw new Error(t('profile.error'));
        }

        success.value = true;
        store.commit('setUser', {
          ...store.state.user,
          name: name.value,
          email: email.value,
        });
      } catch (err) {
        error.value = err.message;
      } finally {
        saving.value = false;
      }
    };

    const changePassword = async () => {
      changingPassword.value = true;
      passwordError.value = '';
      passwordSuccess.value = false;

      try {
        const response = await fetch(
          `${config.apiUrl}/api/users/change-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({
              currentPassword: currentPassword.value,
              newPassword: newPassword.value,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          passwordSuccess.value = true;
          currentPassword.value = '';
          newPassword.value = '';
        } else {
          passwordError.value = data.error || 'Error changing password';
        }
      } catch (err) {
        console.error('Password change error:', err);
        passwordError.value = 'Error changing password';
      } finally {
        changingPassword.value = false;
      }
    };

    const deleteAccount = async () => {
      if (!confirm(t('profile.confirmDelete'))) {
        return;
      }

      deleting.value = true;
      deleteError.value = '';

      try {
        const response = await fetch(
          `${config.apiUrl}/api/users/users/${store.state.user.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        if (response.ok) {
          store.dispatch('logout');
          router.push('/login');
        } else {
          const data = await response.json();
          deleteError.value = data.error || 'Error deleting account';
        }
      } catch (err) {
        deleteError.value = 'Error deleting account';
      } finally {
        deleting.value = false;
      }
    };

    onMounted(fetchProfile);

    return {
      name,
      email,
      username,
      currentPassword,
      newPassword,
      saving,
      changingPassword,
      deleting,
      error,
      success,
      passwordError,
      passwordSuccess,
      deleteError,
      updateProfile,
      changePassword,
      deleteAccount,
    };
  },
};
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-section,
.password-section,
.delete-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-form,
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #333;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

.delete-btn {
  background-color: #dc3545;
}

.error-message {
  color: red;
  margin-top: 1rem;
}

.success-message {
  color: #4caf50;
  margin-top: 1rem;
}
</style>
