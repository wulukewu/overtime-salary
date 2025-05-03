<template>
  <div class="home">
    <h1>Overtime Pay Calculator</h1>
    <div class="calculator-section">
      <form @submit.prevent="calculateOvertime" class="calculator-form">
        <div class="form-group">
          <label for="salary">Monthly Salary:</label>
          <input
            type="number"
            id="salary"
            v-model.number="salary"
            required
            min="0"
          />
        </div>
        <div class="form-group">
          <label for="end_hour">Overtime End Hour (24h):</label>
          <input
            type="number"
            id="end_hour"
            v-model.number="end_hour"
            required
            min="19"
          />
        </div>
        <div class="form-group">
          <label for="minutes">Overtime Minutes:</label>
          <input
            type="number"
            id="minutes"
            v-model.number="minutes"
            required
            min="0"
            max="59"
          />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Calculating...' : 'Calculate' }}
        </button>
        <div v-if="result" class="result">
          <h3>Calculated Overtime Pay: {{ result }}</h3>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
    </div>
    <div class="info-section">
      <h2>About Overtime Pay</h2>
      <p>
        This calculator helps you estimate your overtime pay based on your
        monthly salary and overtime hours. The calculation follows standard
        overtime pay rules where overtime hours are compensated at a higher
        rate.
      </p>
      <p>
        To save your calculations and access more features, please
        <router-link to="/register">create an account</router-link> or
        <router-link to="/login">login</router-link>.
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'HomeCalculator',
  setup() {
    const salary = ref(30000);
    const end_hour = ref(19);
    const minutes = ref(0);
    const result = ref(null);
    const error = ref('');
    const loading = ref(false);

    const calculateOvertime = async () => {
      error.value = '';
      loading.value = true;
      try {
        // Validate inputs
        if (
          salary.value === null ||
          salary.value === undefined ||
          salary.value === ''
        ) {
          throw new Error('Please enter a monthly salary');
        }
        if (
          end_hour.value === null ||
          end_hour.value === undefined ||
          end_hour.value === ''
        ) {
          throw new Error('Please enter an end hour');
        }
        if (
          minutes.value === null ||
          minutes.value === undefined ||
          minutes.value === ''
        ) {
          throw new Error('Please enter minutes');
        }

        const requestBody = {
          salary: Number(salary.value),
          end_hour: Number(end_hour.value),
          minutes: Number(minutes.value),
        };

        const response = await fetch(
          'http://localhost:3000/api/overtime/calculate',
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
          throw new Error(data.error || 'Failed to calculate overtime');
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
</style>
