<template>
  <div class="admin-container">
    <h1>{{ $t('admin.title') }}</h1>
    <div class="admin-content">
      <div class="users-section">
        <h2>{{ $t('admin.userManagement') }}</h2>
        <div v-if="loading" class="loading">{{ $t('admin.loadingUsers') }}</div>
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
                  {{ user.is_admin ? $t('admin.admin') : $t('admin.user') }}
                </button>
              </div>
            </div>
            <div class="user-actions">
              <button
                @click="showPasswordModal(user)"
                class="change-password-btn"
              >
                {{ $t('admin.changePassword') }}
              </button>
              <button
                @click="resetPassword(user.id)"
                :disabled="resettingPassword === user.id"
                class="reset-btn"
              >
                {{
                  resettingPassword === user.id
                    ? $t('admin.resetting')
                    : $t('admin.resetPassword')
                }}
              </button>
              <button
                @click="deleteUser(user.id)"
                :disabled="deletingUser === user.id"
                class="delete-btn"
              >
                {{
                  deletingUser === user.id
                    ? $t('admin.deleting')
                    : $t('admin.deleteUser')
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    <div v-if="showPasswordChangeModal" class="modal">
      <div class="modal-content">
        <h3>{{ $t('admin.passwordChange') }}</h3>
        <form @submit.prevent="changePassword">
          <div class="form-group">
            <label for="newPassword">{{ $t('admin.newPassword') }}:</label>
            <input
              type="password"
              id="newPassword"
              v-model="newPassword"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword"
              >{{ $t('admin.confirmPassword') }}:</label
            >
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              required
              minlength="6"
            />
          </div>
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="!validatePassword()">
              {{ $t('admin.update') }}
            </button>
            <button type="button" @click="closePasswordModal">
              {{ $t('admin.cancel') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Role Change Confirmation Modal -->
    <div v-if="showRoleChangeModal" class="modal">
      <div class="modal-content">
        <h3>{{ $t('admin.confirmRoleChange') }}</h3>
        <p>{{ roleChangeMessage }}</p>
        <div class="modal-actions">
          <button @click="confirmRoleChange" class="confirm-btn">
            {{ $t('admin.confirm') }}
          </button>
          <button @click="showRoleChangeModal = false" class="cancel-btn">
            {{ $t('admin.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Password Reset Confirmation Modal -->
    <div v-if="showResetPasswordModal" class="modal">
      <div class="modal-content">
        <h3>{{ $t('admin.confirmResetPassword') }}</h3>
        <p>{{ $t('admin.resetPasswordConfirmMessage') }}</p>
        <div class="modal-actions">
          <button @click="confirmResetPassword" class="confirm-btn">
            {{ $t('admin.confirm') }}
          </button>
          <button @click="showResetPasswordModal = false" class="cancel-btn">
            {{ $t('admin.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div v-if="showDeleteUserModal" class="modal">
      <div class="modal-content">
        <h3>{{ $t('admin.confirmDeleteUser') }}</h3>
        <p>{{ $t('admin.deleteUserConfirmMessage') }}</p>
        <div class="modal-actions">
          <button @click="confirmDeleteUser" class="delete-btn">
            {{ $t('admin.confirm') }}
          </button>
          <button @click="showDeleteUserModal = false" class="cancel-btn">
            {{ $t('admin.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import config from '../config';

export default {
  name: 'AdminDashboard',
  setup() {
    const store = useStore();
    const { t } = useI18n();
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
    const showRoleChangeModal = ref(false);
    const showResetPasswordModal = ref(false);
    const showDeleteUserModal = ref(false);
    const roleChangeMessage = ref('');

    const validatePassword = () => {
      if (!newPassword.value || !confirmPassword.value) {
        passwordError.value = t('admin.validation.passwordRequired');
        return false;
      }
      if (newPassword.value.length < 6) {
        passwordError.value = t('admin.validation.passwordTooShort');
        return false;
      }
      if (newPassword.value !== confirmPassword.value) {
        passwordError.value = t('admin.validation.passwordsDoNotMatch');
        return false;
      }
      passwordError.value = '';
      return true;
    };

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
          `${config.apiUrl}/api/users/users/${selectedUser.value.id}/set-password`,
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
        const response = await fetch(`${config.apiUrl}/api/users/users`, {
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

    const toggleUserRole = (user) => {
      selectedUser.value = user;

      // Check if this is the last admin
      const adminCount = users.value.filter((u) => u.is_admin).length;
      const isLastAdmin = adminCount === 1 && user.is_admin;

      if (isLastAdmin) {
        store.dispatch('notification/showNotification', {
          message: t('admin.cannotRemoveLastAdmin'),
          type: 'error',
          duration: 5000,
        });
        return;
      }

      if (user.is_admin) {
        roleChangeMessage.value = t('admin.roleChangeToUser', {
          username: user.username,
        });
        if (isLastAdmin) {
          roleChangeMessage.value += '\n\n' + t('admin.lastAdminWarning');
        }
      } else {
        roleChangeMessage.value = t('admin.confirmRoleChangeToAdmin', {
          username: user.username,
        });
      }
      showRoleChangeModal.value = true;
    };

    const confirmRoleChange = async () => {
      try {
        // Check again before making the change
        const adminCount = users.value.filter((u) => u.is_admin).length;
        const isLastAdmin = adminCount === 1 && selectedUser.value.is_admin;

        if (isLastAdmin) {
          store.dispatch('notification/showNotification', {
            message: t('admin.cannotRemoveLastAdmin'),
            type: 'error',
            duration: 5000,
          });
          showRoleChangeModal.value = false;
          return;
        }

        const response = await fetch(
          `${config.apiUrl}/api/users/users/${selectedUser.value.id}/role`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({ is_admin: !selectedUser.value.is_admin }),
          }
        );
        if (response.ok) {
          await fetchUsers();
          showRoleChangeModal.value = false;
        } else {
          const data = await response.json();
          store.dispatch('notification/showNotification', {
            message: data.error || t('admin.roleChangeError'),
            type: 'error',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        store.dispatch('notification/showNotification', {
          message: t('admin.roleChangeError'),
          type: 'error',
          duration: 5000,
        });
      }
    };

    const resetPassword = (user) => {
      selectedUser.value = user;
      showResetPasswordModal.value = true;
    };

    const confirmResetPassword = async () => {
      resettingPassword.value = selectedUser.value.id;
      try {
        const response = await fetch(
          `${config.apiUrl}/api/users/users/${selectedUser.value.id}/reset-password`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          store.dispatch('notification/showNotification', {
            message: t('admin.resetPasswordSuccess', {
              password: data.newPassword,
            }),
            duration: 5000,
          });
        } else {
          const data = await response.json();
          error.value = data.error || t('admin.resetPasswordError');
        }
      } catch (err) {
        error.value = t('admin.resetPasswordError');
      } finally {
        resettingPassword.value = null;
        showResetPasswordModal.value = false;
      }
    };

    const deleteUser = (user) => {
      selectedUser.value = user;
      showDeleteUserModal.value = true;
    };

    const confirmDeleteUser = async () => {
      deletingUser.value = selectedUser.value.id;
      try {
        const response = await fetch(
          `${config.apiUrl}/api/users/users/${selectedUser.value.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        if (response.ok) {
          users.value = users.value.filter(
            (user) => user.id !== selectedUser.value.id
          );
          showDeleteUserModal.value = false;
        } else {
          const data = await response.json();
          error.value = data.error || t('admin.deleteUserError');
        }
      } catch (err) {
        error.value = t('admin.deleteUserError');
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
      showRoleChangeModal,
      showResetPasswordModal,
      showDeleteUserModal,
      roleChangeMessage,
      validatePassword,
      showPasswordModal,
      closePasswordModal,
      changePassword,
      toggleUserRole,
      confirmRoleChange,
      resetPassword,
      confirmResetPassword,
      deleteUser,
      confirmDeleteUser,
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

.modal-content h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: #666;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.confirm-btn {
  background-color: #4caf50;
  color: white;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.confirm-btn:hover,
.cancel-btn:hover,
.delete-btn:hover {
  opacity: 0.9;
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

.change-password-btn {
  background-color: #2196f3;
  color: white;
}

.validation-message {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
</style>
