export default {
  namespaced: true,
  state: {
    show: false,
    message: '',
    duration: 3000,
  },
  mutations: {
    SHOW_NOTIFICATION(state, { message, duration = 3000 }) {
      state.show = true;
      state.message = message;
      state.duration = duration;
    },
    HIDE_NOTIFICATION(state) {
      state.show = false;
      state.message = '';
    },
  },
  actions: {
    showNotification({ commit }, { message, duration }) {
      commit('SHOW_NOTIFICATION', { message, duration });
    },
    hideNotification({ commit }) {
      commit('HIDE_NOTIFICATION');
    },
  },
};
