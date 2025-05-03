<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <div class="dashboard-content">
      <div class="calculator-section">
        <h2>Calculate Overtime Pay</h2>
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
              max="23"
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
            <button @click="saveRecord" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Record' }}
            </button>
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
        </form>
      </div>

      <div class="records-section">
        <h2>Your Overtime Records</h2>
        <div v-if="loadingRecords" class="loading">Loading records...</div>
        <div v-else-if="records.length === 0" class="no-records">
          No records found
        </div>
        <div v-else class="records-list">
          <div v-for="record in records" :key="record.id" class="record-item">
            <div class="record-date">{{ formatDate(record.date) }}</div>
            <div class="record-details">
              <div>Salary: {{ record.salary }}</div>
              <div>End Hour: {{ record.end_hour }}</div>
              <div>Minutes: {{ record.minutes }}</div>
              <div class="record-pay">Pay: {{ record.calculated_pay }}</div>
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
  name: 'OvertimeDashboard',
  setup() {
    const store = useStore();
    const salary = ref(null);
    const end_hour = ref(null);
    const minutes = ref(null);
    const result = ref(null);
    const error = ref('');
    const loading = ref(false);
    const saving = ref(false);
    const records = ref([]);
    const loadingRecords = ref(true);

    const calculateOvertime = async () => {
      error.value = '';
      loading.value = true;
      try {
        const response = await fetch(
          'http://localhost:3000/api/overtime/calculate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({
              salary: salary.value,
              end_hour: end_hour.value,
              minutes: minutes.value,
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to calculate overtime');
        }
        result.value = data.result;
      } catch (err) {
        error.value = err.message;
        result.value = null;
      } finally {
        loading.value = false;
      }
    };

    const saveRecord = async () => {
      saving.value = true;
      try {
        const response = await fetch('http://localhost:3000/api/overtime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${store.state.token}`,
          },
          body: JSON.stringify({
            salary: salary.value,
            end_hour: end_hour.value,
            minutes: minutes.value,
            calculated_pay: result.value,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to save record');
        }
        await fetchRecords();
        result.value = null;
        salary.value = null;
        end_hour.value = null;
        minutes.value = null;
      } catch (err) {
        error.value = err.message;
      } finally {
        saving.value = false;
      }
    };

    const fetchRecords = async () => {
      loadingRecords.value = true;
      try {
        const token = store.state.token;
        console.log('Current token:', token); // Debug log
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await fetch('http://localhost:3000/api/overtime', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Response status:', response.status); // Debug log
        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error response:', errorData); // Debug log
          throw new Error(errorData.error || 'Failed to fetch records');
        }
        records.value = await response.json();
      } catch (err) {
        console.error('Fetch records error:', err); // Debug log
        error.value = err.message;
      } finally {
        loadingRecords.value = false;
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
    };

    onMounted(fetchRecords);

    return {
      salary,
      end_hour,
      minutes,
      result,
      error,
      loading,
      saving,
      records,
      loadingRecords,
      calculateOvertime,
      saveRecord,
      formatDate,
    };
  },
};
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.calculator-section,
.records-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.calculator-form {
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

.records-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-item {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.record-date {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.record-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.record-pay {
  grid-column: span 2;
  font-weight: bold;
  color: #4caf50;
}

.loading,
.no-records {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
