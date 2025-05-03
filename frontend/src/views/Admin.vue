<template>
  <div class="admin-container">
    <h1>Admin Dashboard</h1>
    <div class="admin-content">
      <div class="users-section">
        <h2>User Management</h2>
        <div v-if="loading" class="loading">Loading users...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else class="users-list">
          <div v-for="user in users" :key="user.id" class="user-item">
            <div class="user-info">
              <div class="user-name">{{ user.username }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-role">
                <button
                  class="role-toggle"
                  :class="{ 'is-admin': user.is_admin }"
                  @click="toggleUserRole(user)"
                >
                  {{ user.is_admin ? 'Admin' : 'User' }}
                </button>
              </div>
            </div>
            <div class="user-actions">
              <button
                @click="showPasswordModal(user)"
                class="change-password-btn"
              >
                Change Password
              </button>
              <button
                @click="resetPassword(user.id)"
                :disabled="resettingPassword === user.id"
                class="reset-btn"
              >
                {{
                  resettingPassword === user.id
                    ? 'Resetting...'
                    : 'Reset Password'
                }}
              </button>
              <button
                @click="deleteUser(user.id)"
                :disabled="deletingUser === user.id"
                class="delete-btn"
              >
                {{ deletingUser === user.id ? 'Deleting...' : 'Delete User' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    <div v-if="showPasswordChangeModal" class="modal">
      <div class="modal-content">
        <h3>Change Password for {{ selectedUser?.username }}</h3>
        <div class="form-group">
          <label for="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            placeholder="Enter new password"
          />
          <div
            v-if="newPassword && newPassword.length < 6"
            class="validation-message"
          >
            Password must be at least 6 characters long
          </div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            placeholder="Confirm new password"
          />
          <div
            v-if="confirmPassword && newPassword !== confirmPassword"
            class="validation-message"
          >
            Passwords do not match
          </div>
        </div>
        <div class="modal-actions">
          <button
            @click="changePassword"
            :disabled="!isPasswordValid"
            class="save-btn"
          >
            Save
          </button>
          <button @click="closePasswordModal" class="cancel-btn">Cancel</button>
        </div>
        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AdminDashboard',
  setup() {
    const store = useStore();
    const users = ref([]);
    const loading = ref(true);
    const error = ref('');
    const resettingPassword = ref(null);
    const deletingUser = ref(null);
    const showPasswordChangeModal = ref(false);
    const selectedUser = ref(null);
    const newPassword = ref('');
    const confirmPassword = ref('');
    const passwordError = ref('');

    const isPasswordValid = computed(() => {
      if (!newPassword.value || !confirmPassword.value) {
        return false;
      }
      return (
        newPassword.value.length >= 6 &&
        newPassword.value === confirmPassword.value
      );
    });

    const showPasswordModal = (user) => {
      selectedUser.value = user;
      newPassword.value = '';
      confirmPassword.value = '';
      passwordError.value = '';
      showPasswordChangeModal.value = true;
    };

    const closePasswordModal = () => {
      showPasswordChangeModal.value = false;
      selectedUser.value = null;
      newPassword.value = '';
      confirmPassword.value = '';
      passwordError.value = '';
    };

    const changePassword = async () => {
      if (!newPassword.value || !confirmPassword.value) {
        passwordError.value = 'Please enter and confirm the new password';
        return;
      }

      if (newPassword.value.length < 6) {
        passwordError.value = 'Password must be at least 6 characters long';
        return;
      }

      if (newPassword.value !== confirmPassword.value) {
        passwordError.value = 'Passwords do not match';
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/users/users/${selectedUser.value.id}/set-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({ password: newPassword.value }),
          }
        );

        if (response.ok) {
          alert('Password changed successfully');
          closePasswordModal();
        } else {
          const data = await response.json();
          passwordError.value = data.error || 'Error changing password';
        }
      } catch (err) {
        passwordError.value = 'Error changing password';
      }
    };

    const fetchUsers = async () => {
      loading.value = true;
      error.value = '';
      try {
        const response = await fetch('http://localhost:3000/api/users/users', {
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          users.value = data;
        } else {
          error.value = 'Error fetching users';
        }
      } catch (err) {
        error.value = 'Error fetching users';
      } finally {
        loading.value = false;
      }
    };

    const toggleUserRole = async (user) => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/users/users/${user.id}/role`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({ is_admin: !user.is_admin }),
          }
        );
        if (response.ok) {
          await fetchUsers(); // Refresh the user list
        }
      } catch (error) {
        console.error('Error updating user role:', error);
      }
    };

    const resetPassword = async (userId) => {
      resettingPassword.value = userId;
      try {
        const response = await fetch(
          `http://localhost:3000/api/users/users/${userId}/reset-password`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          alert(`Password reset successful. New password: ${data.newPassword}`);
        } else {
          const data = await response.json();
          error.value = data.error || 'Error resetting password';
        }
      } catch (err) {
        error.value = 'Error resetting password';
      } finally {
        resettingPassword.value = null;
      }
    };

    const deleteUser = async (userId) => {
      if (!confirm('Are you sure you want to delete this user?')) return;

      deletingUser.value = userId;
      try {
        const response = await fetch(
          `http://localhost:3000/api/users/users/${userId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        if (response.ok) {
          users.value = users.value.filter((user) => user.id !== userId);
        } else {
          const data = await response.json();
          error.value = data.error || 'Error deleting user';
        }
      } catch (err) {
        error.value = 'Error deleting user';
      } finally {
        deletingUser.value = null;
      }
    };

    onMounted(fetchUsers);

    return {
      users,
      loading,
      error,
      resettingPassword,
      deletingUser,
      showPasswordChangeModal,
      selectedUser,
      newPassword,
      confirmPassword,
      passwordError,
      isPasswordValid,
      showPasswordModal,
      closePasswordModal,
      changePassword,
      toggleUserRole,
      resetPassword,
      deleteUser,
    };
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-content {
  margin-top: 2rem;
}

.users-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.user-email {
  color: #666;
}

.user-role {
  font-size: 0.9rem;
  color: #4caf50;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #ffc107;
  color: #000;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  color: red;
  margin-top: 1rem;
}

.role-toggle {
  background-color: #2196f3;
}

.role-toggle.is-admin {
  background-color: #ff9800;
}

.role-toggle:hover {
  opacity: 0.8;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
}

.change-password-btn {
  background-color: #2196f3;
  color: white;
}

.validation-message {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.error-message {
  color: #f44336;
  margin-top: 1rem;
  text-align: center;
}
</style>
