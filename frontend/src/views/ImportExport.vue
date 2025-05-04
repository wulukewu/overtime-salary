<template>
  <div class="import-export-container">
    <h1>Import/Export Records</h1>

    <div class="card">
      <h2>Export Records</h2>
      <p>
        Download all your overtime records as a CSV file. The file will include
        your salary, end hour, minutes, calculated pay, and group information.
      </p>
      <button @click="exportRecords" class="btn btn-primary">
        Export Records
      </button>
    </div>

    <div class="card">
      <h2>Import Records</h2>
      <p>
        Import overtime records from a CSV file. Make sure your file follows the
        template format.
      </p>
      <p class="note">
        Required fields: Date, Salary, End Hour, Minutes. Group is optional.
      </p>

      <div class="import-section">
        <label class="file-input">
          <span class="file-input-text">Choose File</span>
          <input
            type="file"
            accept=".csv"
            @change="handleFileUpload"
            ref="fileInput"
          />
        </label>
        <button
          @click="importRecords"
          class="btn btn-primary"
          :disabled="!selectedFile"
        >
          Import Records
        </button>
      </div>

      <div v-if="importResult" class="import-result">
        <h3>Import Results</h3>
        <p>Successfully imported: {{ importResult.imported }} records</p>
        <div v-if="importResult.errors.length > 0">
          <h4>Errors:</h4>
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
      <h2>CSV Template</h2>
      <p>
        Download a template CSV file to help you format your data correctly.
      </p>
      <p class="note">
        The template includes example values. Replace them with your actual
        data.
      </p>
      <button @click="downloadTemplate" class="btn btn-secondary">
        Download Template
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useStore } from 'vuex';
import config from '../config';

export default {
  name: 'ImportExport',
  data() {
    return {
      selectedFile: null,
      importResult: null,
    };
  },
  setup() {
    const store = useStore();
    return { store };
  },
  methods: {
    async exportRecords() {
      try {
        const response = await axios.get(
          `${config.apiUrl}/api/overtime/export-csv`,
          {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${this.store.state.token}`,
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
        alert('Failed to export records. Please try again.');
      }
    },

    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
      this.importResult = null;
    },

    async importRecords() {
      if (!this.selectedFile) {
        alert('Please select a file first.');
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const response = await axios.post(
          `${config.apiUrl}/api/overtime/import-csv`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${this.store.state.token}`,
            },
          }
        );

        this.importResult = response.data;
        this.selectedFile = null;
        this.$refs.fileInput.value = '';
      } catch (error) {
        console.error('Error importing records:', error);
        alert(
          'Failed to import records. Please check your file format and try again.'
        );
      }
    },

    async downloadTemplate() {
      try {
        const response = await axios.get(
          `${config.apiUrl}/api/overtime/csv-template`,
          {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${this.store.state.token}`,
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
        alert('Failed to download template. Please try again.');
      }
    },
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
