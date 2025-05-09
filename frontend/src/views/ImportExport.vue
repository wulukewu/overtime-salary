<template>
  <div class="import-export-container">
    <h1>{{ $t('importExport.title') }}</h1>
    <div class="import-export-content">
      <div class="import-section">
        <h2>{{ $t('importExport.import') }}</h2>
        <div class="file-input">
          <input
            type="file"
            @change="handleFileSelect"
            accept=".json,.csv"
            ref="fileInput"
          />
          <button @click="importRecords" :disabled="!selectedFile || importing">
            {{ importing ? $t('common.loading') : $t('importExport.import') }}
          </button>
        </div>
        <div v-if="importError" class="error-message">{{ importError }}</div>
        <div v-if="importSuccess" class="success-message">
          {{ $t('importExport.importSuccess') }}
        </div>
      </div>

      <div class="export-section">
        <h2>{{ $t('importExport.export') }}</h2>
        <div class="export-options">
          <div class="format-select">
            <label>{{ $t('importExport.format') }}:</label>
            <select v-model="exportFormat">
              <option value="json">{{ $t('importExport.json') }}</option>
              <option value="csv">{{ $t('importExport.csv') }}</option>
            </select>
          </div>
          <button @click="exportRecords" :disabled="exporting">
            {{ exporting ? $t('common.loading') : $t('importExport.export') }}
          </button>
        </div>
        <div v-if="exportError" class="error-message">{{ exportError }}</div>
        <div v-if="exportSuccess" class="success-message">
          {{ $t('importExport.exportSuccess') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import config from '../config';

export default {
  name: 'ImportExport',
  setup() {
    const store = useStore();
    const { t } = useI18n();
    const selectedFile = ref(null);
    const importing = ref(false);
    const exporting = ref(false);
    const importError = ref('');
    const exportError = ref('');
    const importSuccess = ref(false);
    const exportSuccess = ref(false);
    const exportFormat = ref('json');
    const fileInput = ref(null);

    const handleFileSelect = (event) => {
      selectedFile.value = event.target.files[0];
      importError.value = '';
      importSuccess.value = false;
    };

    const importRecords = async () => {
      if (!selectedFile.value) return;

      importing.value = true;
      importError.value = '';
      importSuccess.value = false;

      try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);

        const response = await fetch(`${config.apiUrl}/api/overtime/import`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t('importExport.importError'));
        }

        importSuccess.value = true;
        fileInput.value.value = '';
        selectedFile.value = null;
      } catch (err) {
        importError.value = err.message;
      } finally {
        importing.value = false;
      }
    };

    const exportRecords = async () => {
      exporting.value = true;
      exportError.value = '';
      exportSuccess.value = false;

      try {
        const response = await fetch(
          `${config.apiUrl}/api/overtime/export?format=${exportFormat.value}`,
          {
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t('importExport.exportError'));
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overtime-records.${exportFormat.value}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        exportSuccess.value = true;
      } catch (err) {
        exportError.value = err.message;
      } finally {
        exporting.value = false;
      }
    };

    return {
      selectedFile,
      importing,
      exporting,
      importError,
      exportError,
      importSuccess,
      exportSuccess,
      exportFormat,
      fileInput,
      handleFileSelect,
      importRecords,
      exportRecords,
    };
  },
};
</script>

<style scoped>
.import-export-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.import-export-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.import-section,
.export-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.format-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

select {
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

.error-message {
  color: #dc3545;
  margin-top: 1rem;
}

.success-message {
  color: #28a745;
  margin-top: 1rem;
}
</style>
