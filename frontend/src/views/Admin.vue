<template>
  <div class="admin">
    <h1>Admin Dashboard</h1>
    <div class="admin-content">
      <div class="users-section">
        <h2>User Management</h2>
        <div v-if="loading" class="loading">Loading users...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else class="users-list">
          <div v-for="user in users" :key="user.id" class="user-item">
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-role">
                {{ user.is_admin ? 'Admin' : 'User' }}
              </div>
            </div>
            <div class="user-actions">
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
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
      resetPassword,
      deleteUser,
    };
  },
};
</script>

<style scoped>
.admin {
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
</style>
