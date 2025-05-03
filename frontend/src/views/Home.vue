<template>
  <div class="home">
    <h1>Welcome to Overtime Salary Calculator</h1>
    <p>Redirecting to dashboard...</p>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter();

    onMounted(() => {
      router.push('/dashboard');
    });
  },
};
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>
