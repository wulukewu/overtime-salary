<template>
  <div class="import-export-container">
    <h1>{{ $t('importExport.title') }}</h1>

    <div class="card">
      <h2>{{ $t('importExport.export') }}</h2>
      <p>{{ $t('importExport.exportDescription') }}</p>
      <button @click="exportRecords" class="btn btn-primary">
        {{ $t('importExport.export') }}
      </button>
    </div>

    <div class="card">
      <h2>{{ $t('importExport.import') }}</h2>
      <p>{{ $t('importExport.importDescription') }}</p>
      <p class="note">{{ $t('importExport.requiredFields') }}</p>

      <div class="import-section">
        <label class="file-input">
          <span class="file-input-text">{{
            $t('importExport.chooseFile')
          }}</span>
          <input
            type="file"
            accept=".csv"
            @change="handleFileSelect"
            ref="fileInput"
          />
        </label>
        <button
          @click="importRecords"
          class="btn btn-primary"
          :disabled="!selectedFile"
        >
          {{ $t('importExport.import') }}
        </button>
      </div>

      <div v-if="importResult" class="import-result">
        <h3>{{ $t('importExport.importResults') }}</h3>
        <p>
          {{
            $t('importExport.successfullyImported', {
              count: importResult.imported,
            })
          }}
        </p>
        <div v-if="importResult.errors.length > 0">
          <h4>{{ $t('importExport.errors') }}:</h4>
          <ul>
            <li v-for="(error, index) in importResult.errors" :key="index">
              {{ error.error }}
              <div v-if="error.row" class="error-row">
                <pre>{{ JSON.stringify(error.row, null, 2) }}</pre>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>{{ $t('importExport.csvTemplate') }}</h2>
      <p>{{ $t('importExport.templateDescription') }}</p>
      <p class="note">{{ $t('importExport.templateNote') }}</p>
      <button @click="downloadTemplate" class="btn btn-secondary">
        {{ $t('importExport.downloadTemplate') }}
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import config from '../config';
import { ref } from 'vue';

export default {
  name: 'ImportExport',
  setup() {
    const store = useStore();
    const { t } = useI18n();
    const selectedFile = ref(null);
    const importResult = ref(null);

    const handleFileSelect = (event) => {
      selectedFile.value = event.target.files[0];
    };

    const importRecords = async () => {
      if (!selectedFile.value) {
        store.dispatch('notification/showNotification', {
          message: t('importExport.selectFileFirst'),
          duration: 3000,
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile.value);

      try {
        const response = await axios.post(
          `${config.apiUrl}/api/overtime/import-csv`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        importResult.value = response.data;
        selectedFile.value = null;
        document.querySelector('input[type="file"]').value = '';
      } catch (error) {
        console.error('Error importing records:', error);
        store.dispatch('notification/showNotification', {
          message: t('importExport.importError'),
          duration: 3000,
        });
      }
    };

    const downloadTemplate = async () => {
      try {
        const response = await axios.get(
          `${config.apiUrl}/api/overtime/csv-template`,
          {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'overtime_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('Error downloading template:', error);
        store.dispatch('notification/showNotification', {
          message: t('importExport.templateError'),
          duration: 3000,
        });
      }
    };

    const exportRecords = async () => {
      try {
        const response = await axios.get(
          `${config.apiUrl}/api/overtime/export-csv`,
          {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'overtime_records.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('Error exporting records:', error);
        store.dispatch('notification/showNotification', {
          message: t('importExport.exportError'),
          duration: 3000,
        });
      }
    };

    return {
      selectedFile,
      importResult,
      handleFileSelect,
      importRecords,
      downloadTemplate,
      exportRecords,
    };
  },
};
</script>

<style scoped>
.import-export-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 30px;
  color: #2c3e50;
}

h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

p {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.note {
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}

.btn {
  height: 42px;
  padding: 0 20px;
  min-width: 120px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #2196f3;
  color: white;
}

.btn-secondary:hover {
  background-color: #1976d2;
}

.import-section {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  padding: 0 20px;
}

.file-input {
  position: relative;
  display: inline-block;
  height: 42px;
  min-width: 120px;
}

.file-input input[type='file'] {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-input-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 20px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
}

.file-input:hover .file-input-text {
  background-color: #e9ecef;
  border-color: #ccc;
}

.file-input input[type='file']:focus + .file-input-text {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

.import-result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.import-result h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.import-result h4 {
  color: #dc3545;
  margin: 15px 0 10px;
}

.error-row {
  margin: 10px 0;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error-row pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9em;
  color: #666;
}
</style>
