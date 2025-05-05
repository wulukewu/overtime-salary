import { createStore } from 'vuex';
import config from '../config';
import notification from './modules/notification';

export default createStore({
  state: {
    user: null,
    token: localStorage.getItem('token') || null,
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    monthly_salary: localStorage.getItem('monthly_salary')
      ? Number(localStorage.getItem('monthly_salary'))
      : 0,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setToken(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    },
    setAdmin(state, isAdmin) {
      state.isAdmin = isAdmin;
      if (isAdmin) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAdmin = false;
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
    },
    setMonthlySalary(state, salary) {
      state.monthly_salary = salary;
      localStorage.setItem('monthly_salary', salary);
    },
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await fetch(`${config.apiUrl}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();
        if (response.ok) {
          commit('setToken', data.token);

          if (data.user) {
            commit('setUser', data.user);
            commit('setAdmin', data.user.is_admin || false);
          }

          const settingsResponse = await fetch(
            `${config.apiUrl}/api/users/settings`,
            {
              headers: {
                Authorization: `Bearer ${data.token}`,
              },
            }
          );

          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            commit('setMonthlySalary', settingsData.monthly_salary || 0);
          }

          return { success: true, user: data.user };
        } else {
          return { success: false, error: data.error };
        }
      } catch (error) {
        return { success: false, error: 'Network error' };
      }
    },
    async register({ commit }, userData) {
      try {
        const response = await fetch(`${config.apiUrl}/api/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();
        if (response.ok) {
          commit('setToken', data.token);
          if (data.user) {
            commit('setUser', data.user);
            commit('setAdmin', data.user.is_admin || false);
          }
          return { success: true };
        } else {
          return { success: false, error: data.error };
        }
      } catch (error) {
        return { success: false, error: 'Network error' };
      }
    },
    logout({ commit }) {
      commit('logout');
      commit('setMonthlySalary', 0);
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.isAdmin,
    currentUser: (state) => state.user,
    getToken: (state) => state.token,
  },
  modules: {
    notification,
  },
});
