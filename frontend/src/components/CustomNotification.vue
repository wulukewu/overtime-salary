<template>
  <Transition name="notification">
    <div v-if="show" class="notification-overlay" @click="handleOverlayClick">
      <div class="notification" @click.stop>
        <div class="notification-content">
          <span class="notification-message">{{ message }}</span>
          <button class="close-button" @click="close">×</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { onMounted, onUnmounted } from 'vue';

export default {
  name: 'CustomNotification',
  props: {
    message: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 3000,
    },
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    let timeoutId = null;

    const close = () => {
      emit('close');
    };

    const handleOverlayClick = (event) => {
      if (event.target.classList.contains('notification-overlay')) {
        close();
      }
    };

    onMounted(() => {
      if (props.duration > 0) {
        timeoutId = setTimeout(() => {
          close();
        }, props.duration);
      }
    });

    onUnmounted(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });

    return {
      close,
      handleOverlayClick,
    };
  },
};
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.notification {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  min-width: 300px;
  max-width: 90%;
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.notification-message {
  flex: 1;
  color: #2c3e50;
  font-size: 1rem;
  line-height: 1.5;
}

.close-button {
  background: none;
  border: none;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.notification-enter-active,
.notification-leave-active {
  transition: opacity 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
}
</style>
