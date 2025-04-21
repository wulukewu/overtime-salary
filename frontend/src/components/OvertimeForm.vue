<template>
  <div class="overtime-form">
    <h2>Overtime Pay Calculator</h2>

    <form @submit.prevent="calculate">
      <label>
        Monthly Salary:
        <input type="number" v-model.number="salary" required />
      </label>

      <label>
        Overtime End Hour (24h):
        <input
          type="number"
          v-model.number="endHour"
          required
          min="19"
          max="23"
        />
      </label>

      <label>
        Overtime Minutes:
        <input
          type="number"
          v-model.number="minutes"
          required
          min="0"
          max="59"
        />
      </label>

      <button type="submit">Calculate</button>
    </form>

    <div v-if="result !== null" class="result">
      <h3>Calculated Overtime Pay: {{ result }}</h3>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      salary: null,
      endHour: null,
      minutes: null,
      result: null,
    };
  },
  methods: {
    async calculate() {
      try {
        const response = await fetch('http://localhost:3000/api/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            salary: this.salary,
            endHour: this.endHour,
            minutes: this.minutes,
          }),
        });

        const data = await response.json();
        this.result = data.result;
      } catch (error) {
        console.error('API call failed:', error);
        this.result = 'Error calculating pay';
      }
    },
  },
};
</script>

<style scoped>
.overtime-form {
  max-width: 400px;
  margin: auto;
  padding: 1rem;
}
label {
  display: block;
  margin: 0.5rem 0;
}
input {
  width: 100%;
  padding: 0.4rem;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
}
.result {
  margin-top: 1rem;
  font-weight: bold;
}
</style>
