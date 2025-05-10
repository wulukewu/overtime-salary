<template>
  <div class="settings-container">
    <h1>{{ $t('settings.title') }}</h1>
    <div class="settings-content">
      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="form-group">
          <label for="monthlySalary">{{ $t('settings.monthlySalary') }}:</label>
          <input
            type="number"
            id="monthlySalary"
            v-model.number="monthlySalary"
            required
            min="0"
          />
        </div>
        <button type="submit" :disabled="saving">
          {{ saving ? $t('settings.saving') : $t('settings.save') }}
        </button>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">
          {{ $t('settings.success') }}
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import config from '../config';

export default {
  name: 'UserSettings',
  setup() {
    const store = useStore();
    const { t } = useI18n();
    const monthlySalary = ref(0);
    const saving = ref(false);
    const error = ref('');
    const success = ref(false);

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/users/settings`, {
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t('settings.error'));
        }

        const data = await response.json();
        monthlySalary.value = data.monthly_salary;
      } catch (err) {
        error.value = err.message;
      }
    };

    const saveSettings = async () => {
      saving.value = true;
      error.value = '';
      success.value = false;

      try {
        const response = await fetch(`${config.apiUrl}/api/users/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${store.state.token}`,
          },
          body: JSON.stringify({
            monthly_salary: monthlySalary.value,
          }),
        });

        if (!response.ok) {
          throw new Error(t('settings.error'));
        }

        store.commit('setMonthlySalary', monthlySalary.value);
        success.value = true;
      } catch (err) {
        error.value = err.message;
      } finally {
        saving.value = false;
      }
    };

    onMounted(fetchSettings);

    return {
      monthlySalary,
      saving,
      error,
      success,
      saveSettings,
    };
  },
};
</script>

<style scoped>
.settings-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  color: #dc3545;
  margin-top: 1rem;
}

.success-message {
  color: #28a745;
  margin-top: 1rem;
}
</style>
