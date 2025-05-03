<template>
  <div class="settings">
    <h1>Settings</h1>
    <div class="settings-content">
      <div class="salary-section">
        <h2>Monthly Salary</h2>
        <form @submit.prevent="updateSalary" class="salary-form">
          <div class="form-group">
            <label for="monthly_salary">Monthly Salary:</label>
            <input
              type="number"
              id="monthly_salary"
              v-model.number="monthly_salary"
              required
              min="0"
            />
          </div>
          <button type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Salary' }}
          </button>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'UserSettings',
  setup() {
    const store = useStore();
    const monthly_salary = ref(0);
    const error = ref('');
    const success = ref('');
    const saving = ref(false);

    const fetchUserSettings = async () => {
      try {
        const response = await fetch(
          'http://localhost:3000/api/users/settings',
          {
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        monthly_salary.value = data.monthly_salary || 0;
      } catch (err) {
        console.error('Error fetching settings:', err);
        error.value = err.message;
      }
    };

    const updateSalary = async () => {
      saving.value = true;
      error.value = '';
      success.value = '';
      try {
        const response = await fetch(
          'http://localhost:3000/api/users/settings',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({
              monthly_salary: monthly_salary.value,
            }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update salary');
        }
        success.value = 'Salary updated successfully';
        // Update the store with the new salary
        store.commit('setMonthlySalary', monthly_salary.value);
      } catch (err) {
        console.error('Error updating salary:', err);
        error.value = err.message;
      } finally {
        saving.value = false;
      }
    };

    onMounted(fetchUserSettings);

    return {
      monthly_salary,
      error,
      success,
      saving,
      updateSalary,
    };
  },
};
</script>

<style scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.salary-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
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
  margin-top: 1rem;
}

.success-message {
  color: #4caf50;
  margin-top: 1rem;
}
</style>
