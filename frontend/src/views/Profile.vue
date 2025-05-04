<template>
  <div class="profile">
    <h1>Profile</h1>
    <div class="profile-content">
      <div class="profile-section">
        <h2>Update Profile</h2>
        <form @submit.prevent="updateProfile" class="profile-form">
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
          <button type="submit" :disabled="updating">
            {{ updating ? 'Updating...' : 'Update Profile' }}
          </button>
          <div v-if="updateError" class="error-message">{{ updateError }}</div>
          <div v-if="updateSuccess" class="success-message">
            Profile updated successfully
          </div>
        </form>
      </div>

      <div class="password-section">
        <h2>Change Password</h2>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label for="currentPassword">Current Password:</label>
            <input
              type="password"
              id="currentPassword"
              v-model="currentPassword"
              required
              placeholder="Enter current password"
            />
          </div>
          <div class="form-group">
            <label for="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              v-model="newPassword"
              required
              placeholder="Enter new password"
            />
          </div>
          <button type="submit" :disabled="changingPassword">
            {{ changingPassword ? 'Changing...' : 'Change Password' }}
          </button>
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
          <div v-if="passwordSuccess" class="success-message">
            Password changed successfully
          </div>
        </form>
      </div>

      <div class="delete-section">
        <h2>Delete Account</h2>
        <button @click="deleteAccount" :disabled="deleting" class="delete-btn">
          {{ deleting ? 'Deleting...' : 'Delete Account' }}
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
import config from '../config';

export default {
  name: 'UserProfile',
  setup() {
    const store = useStore();
    const router = useRouter();
    const name = ref('');
    const currentPassword = ref('');
    const newPassword = ref('');
    const updating = ref(false);
    const changingPassword = ref(false);
    const deleting = ref(false);
    const updateError = ref('');
    const updateSuccess = ref(false);
    const passwordError = ref('');
    const passwordSuccess = ref(false);
    const deleteError = ref('');

    const updateProfile = async () => {
      updating.value = true;
      updateError.value = '';
      updateSuccess.value = false;

      try {
        const response = await fetch(
          `${config.apiUrl}/api/users/users/${store.state.user.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({
              email: email.value,
              username: username.value,
            }),
          }
        );

        if (response.ok) {
          updateSuccess.value = true;
          store.commit('setUser', { ...store.state.user, name: name.value });
        } else {
          const data = await response.json();
          updateError.value = data.error || 'Error updating profile';
        }
      } catch (err) {
        updateError.value = 'Error updating profile';
      } finally {
        updating.value = false;
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
      if (
        !confirm(
          'Are you sure you want to delete your account? This action cannot be undone.'
        )
      ) {
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

    onMounted(() => {
      if (store.state.user) {
        name.value = store.state.user.name;
      }
    });

    return {
      name,
      currentPassword,
      newPassword,
      updating,
      changingPassword,
      deleting,
      updateError,
      updateSuccess,
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
.profile {
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
