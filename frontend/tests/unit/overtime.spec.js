import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Dashboard from '@/views/Dashboard.vue';

// Create a mock store
const createVuexStore = () => {
  return createStore({
    state: {
      token: 'fake-token',
      monthly_salary: 5000,
      user: { username: 'testuser' }
    },
    getters: {
      isAuthenticated: () => true
    }
  });
};

describe('Dashboard.vue', () => {
  it('renders the overtime calculator', () => {
    const store = createVuexStore();
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [store],
        stubs: ['router-link', 'router-view']
      }
    });
    
    expect(wrapper.text()).toContain('Overtime Calculator');
  });
  
  it('validates end hour input', async () => {
    const store = createVuexStore();
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [store],
        stubs: ['router-link', 'router-view']
      }
    });
    
    // Set invalid end hour
    await wrapper.find('input[name="end_hour"]').setValue('18');
    await wrapper.find('button.calculate-btn').trigger('click');
    
    // Should show validation error
    expect(wrapper.text()).toContain('End hour must be 19 or later');
  });
});