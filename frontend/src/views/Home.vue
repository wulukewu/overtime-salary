<template>
  <div class="home">
    <h1>{{ $t('home.title') }}</h1>
    <div class="calculator-section">
      <form
        @submit.prevent="calculateOvertime"
        class="calculator-form"
        novalidate
      >
        <div class="form-group">
          <label for="salary">{{ $t('home.monthlySalary') }}:</label>
          <input
            type="number"
            id="salary"
            v-model.number="salary"
            required
            min="0"
            @blur="validateSalary"
          />
          <span v-if="salaryError" class="field-error">{{ salaryError }}</span>
        </div>
        <div class="form-group">
          <label for="end_hour">{{ $t('home.overtimeEndHour') }}:</label>
          <input
            type="number"
            id="end_hour"
            v-model.number="end_hour"
            required
            min="19"
            @blur="validateEndHour"
          />
          <span v-if="endHourError" class="field-error">{{
            endHourError
          }}</span>
        </div>
        <div class="form-group">
          <label for="minutes">{{ $t('home.overtimeMinutes') }}:</label>
          <input
            type="number"
            id="minutes"
            v-model.number="minutes"
            required
            min="0"
            max="59"
            @blur="validateMinutes"
          />
          <span v-if="minutesError" class="field-error">{{
            minutesError
          }}</span>
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? $t('home.calculating') : $t('home.calculate') }}
        </button>
        <div v-if="result !== null" class="result">
          <h3 v-if="result === 0" class="zero-result">
            {{ $t('home.noOvertimePay') }}
          </h3>
          <h3 v-else>{{ $t('home.calculatedOvertimePay') }}: {{ result }}</h3>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
    </div>
    <div class="info-section">
      <h2>{{ $t('home.aboutTitle') }}</h2>
      <p>{{ $t('home.aboutText') }}</p>
      <p v-if="!isLoggedIn">
        {{ $t('home.toSaveCalculations') }}
        <router-link to="/register">{{ $t('home.createAccount') }}</router-link>
        {{ $t('common.or') }}
        <router-link to="/login">{{ $t('home.login') }}</router-link
        >.
      </p>
      <p v-else>
        <a href="#" @click.prevent="goToDashboard">{{
          $t('home.goToDashboard')
        }}</a>
        {{ $t('home.dashboardText') }}
      </p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import config from '../config';

export default {
  name: 'HomeCalculator',
  setup() {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    const salary = ref(30000);
    const end_hour = ref(19);
    const minutes = ref(0);
    const result = ref(null);
    const error = ref('');
    const loading = ref(false);
    const salaryError = ref('');
    const endHourError = ref('');
    const minutesError = ref('');

    const isLoggedIn = computed(() => store.state.token !== null);

    const goToDashboard = () => {
      router.push('/dashboard');
    };

    const validateSalary = () => {
      if (
        salary.value === null ||
        salary.value === undefined ||
        salary.value === ''
      ) {
        salaryError.value = t('home.validation.enterSalary');
        return false;
      }
      if (salary.value < 0) {
        salaryError.value = t('home.validation.negativeSalary');
        return false;
      }
      salaryError.value = '';
      return true;
    };

    const validateEndHour = () => {
      if (
        end_hour.value === null ||
        end_hour.value === undefined ||
        end_hour.value === ''
      ) {
        endHourError.value = t('home.validation.enterEndHour');
        return false;
      }
      if (end_hour.value < 19) {
        endHourError.value = t('home.validation.endHourTooEarly');
        return false;
      }
      endHourError.value = '';
      return true;
    };

    const validateMinutes = () => {
      if (
        minutes.value === null ||
        minutes.value === undefined ||
        minutes.value === ''
      ) {
        minutesError.value = t('home.validation.enterMinutes');
        return false;
      }
      if (minutes.value < 0 || minutes.value > 59) {
        minutesError.value = t('home.validation.invalidMinutes');
        return false;
      }
      minutesError.value = '';
      return true;
    };

    const calculateOvertime = async () => {
      error.value = '';
      loading.value = true;
      try {
        // Validate all inputs
        if (!validateSalary() || !validateEndHour() || !validateMinutes()) {
          loading.value = false;
          return;
        }

        const requestBody = {
          salary: Number(salary.value),
          end_hour: Number(end_hour.value),
          minutes: Number(minutes.value),
        };

        const response = await fetch(
          `${config.apiUrl}/api/overtime/calculate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t('common.error'));
        }
        result.value = Math.round(data.result);
      } catch (err) {
        console.error('Error in calculateOvertime:', err);
        error.value = err.message;
        result.value = null;
      } finally {
        loading.value = false;
      }
    };

    return {
      salary,
      end_hour,
      minutes,
      result,
      error,
      loading,
      calculateOvertime,
      validateSalary,
      validateEndHour,
      validateMinutes,
      salaryError,
      endHourError,
      minutesError,
      isLoggedIn,
      goToDashboard,
    };
  },
};
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.calculator-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.calculator-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
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

.result {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.error-message {
  color: red;
  margin-top: 1rem;
}

.info-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-section p {
  line-height: 1.6;
  margin-bottom: 1rem;
}

.info-section a {
  color: #4caf50;
  text-decoration: none;
}

.info-section a:hover {
  text-decoration: underline;
}

.zero-result {
  color: #666;
  font-style: italic;
}

.field-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
