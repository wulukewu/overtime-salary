<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <div class="dashboard-content">
      <div class="calculator-section">
        <h2>Calculate Overtime Pay</h2>
        <form @submit.prevent="calculateOvertime" class="calculator-form">
          <div class="form-group">
            <label>Monthly Salary: {{ store.state.monthly_salary }}</label>
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
        <div class="groups-header">
          <h2>Your Overtime Records</h2>
          <button @click="showNewGroupModal = true" class="new-group-button">
            New Group
          </button>
        </div>
        <div v-if="loadingRecords" class="loading">Loading records...</div>
        <div v-else-if="records.length === 0" class="no-records">
          No records found
        </div>
        <div v-else class="groups-list">
          <div v-for="group in groups" :key="group.id" class="group-item">
            <div class="group-header" @click="toggleGroup(group.id)">
              <div class="group-name">
                {{ group.name }}
                <span class="group-total">
                  (Total: {{ getGroupTotal(group.id) }})
                </span>
              </div>
              <div class="group-actions">
                <button @click.stop="editGroup(group)" class="edit-button">
                  Edit
                </button>
                <button
                  @click.stop="deleteGroup(group.id)"
                  class="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
            <div
              v-if="!collapsedGroups.includes(group.id)"
              class="group-records"
            >
              <div
                v-for="record in getGroupRecords(group.id)"
                :key="record.id"
                class="record-item"
              >
                <div class="record-date">{{ formatDate(record.date) }}</div>
                <div class="record-details">
                  <div>Salary: {{ record.salary }}</div>
                  <div>End Hour: {{ record.end_hour }}</div>
                  <div>Minutes: {{ record.minutes }}</div>
                  <div class="record-pay">Pay: {{ record.calculated_pay }}</div>
                </div>
                <button
                  class="delete-button"
                  @click="deleteRecord(record.id)"
                  :disabled="deletingId === record.id"
                >
                  {{ deletingId === record.id ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
          <!-- Ungrouped records -->
          <div class="group-item">
            <div class="group-header" @click="toggleGroup('ungrouped')">
              <div class="group-name">
                Ungrouped
                <span class="group-total">
                  (Total: {{ getGroupTotal('ungrouped') }})
                </span>
              </div>
            </div>
            <div
              v-if="!collapsedGroups.includes('ungrouped')"
              class="group-records"
            >
              <div
                v-for="record in getGroupRecords('ungrouped')"
                :key="record.id"
                class="record-item"
              >
                <div class="record-date">{{ formatDate(record.date) }}</div>
                <div class="record-details">
                  <div>Salary: {{ record.salary }}</div>
                  <div>End Hour: {{ record.end_hour }}</div>
                  <div>Minutes: {{ record.minutes }}</div>
                  <div class="record-pay">Pay: {{ record.calculated_pay }}</div>
                </div>
                <button
                  class="delete-button"
                  @click="deleteRecord(record.id)"
                  :disabled="deletingId === record.id"
                >
                  {{ deletingId === record.id ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Group Modal -->
      <div v-if="showNewGroupModal" class="modal">
        <div class="modal-content">
          <h3>Create New Group</h3>
          <form @submit.prevent="createGroup">
            <div class="form-group">
              <label for="groupName">Group Name:</label>
              <input
                type="text"
                id="groupName"
                v-model="newGroupName"
                required
              />
            </div>
            <button type="submit" :disabled="creatingGroup">
              {{ creatingGroup ? 'Creating...' : 'Create' }}
            </button>
            <button type="button" @click="showNewGroupModal = false">
              Cancel
            </button>
          </form>
        </div>
      </div>

      <!-- Edit Group Modal -->
      <div v-if="editingGroup" class="modal">
        <div class="modal-content">
          <h3>Edit Group</h3>
          <form @submit.prevent="updateGroup">
            <div class="form-group">
              <label for="editGroupName">Group Name:</label>
              <input
                type="text"
                id="editGroupName"
                v-model="editingGroup.name"
                required
              />
            </div>
            <button type="submit" :disabled="updatingGroup">
              {{ updatingGroup ? 'Updating...' : 'Update' }}
            </button>
            <button type="button" @click="editingGroup = null">Cancel</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'OvertimeDashboard',
  setup() {
    const store = useStore();
    const end_hour = ref(19);
    const minutes = ref(0);
    const result = ref(null);
    const error = ref('');
    const loading = ref(false);
    const saving = ref(false);
    const records = ref([]);
    const groups = ref([]);
    const loadingRecords = ref(true);
    const deletingId = ref(null);
    const showNewGroupModal = ref(false);
    const newGroupName = ref('');
    const creatingGroup = ref(false);
    const editingGroup = ref(null);
    const updatingGroup = ref(false);
    const collapsedGroups = ref([]);

    const getGroupRecords = (groupId) => {
      if (groupId === 'ungrouped') {
        return records.value.filter((record) => !record.group_id);
      }
      return records.value.filter((record) => record.group_id === groupId);
    };

    const getGroupTotal = (groupId) => {
      const groupRecords = getGroupRecords(groupId);
      return groupRecords.reduce(
        (sum, record) => sum + record.calculated_pay,
        0
      );
    };

    const toggleGroup = (groupId) => {
      const index = collapsedGroups.value.indexOf(groupId);
      if (index === -1) {
        collapsedGroups.value.push(groupId);
      } else {
        collapsedGroups.value.splice(index, 1);
      }
    };

    const createGroup = async () => {
      creatingGroup.value = true;
      try {
        const response = await fetch('http://localhost:3000/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${store.state.token}`,
          },
          body: JSON.stringify({ name: newGroupName.value }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create group');
        }
        await fetchGroups();
        showNewGroupModal.value = false;
        newGroupName.value = '';
      } catch (err) {
        console.error('Error creating group:', err);
        error.value = err.message;
      } finally {
        creatingGroup.value = false;
      }
    };

    const editGroup = (group) => {
      editingGroup.value = { ...group };
    };

    const updateGroup = async () => {
      updatingGroup.value = true;
      try {
        const response = await fetch(
          `http://localhost:3000/api/groups/${editingGroup.value.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({ name: editingGroup.value.name }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update group');
        }
        await fetchGroups();
        editingGroup.value = null;
      } catch (err) {
        console.error('Error updating group:', err);
        error.value = err.message;
      } finally {
        updatingGroup.value = false;
      }
    };

    const deleteGroup = async (groupId) => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/groups/${groupId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete group');
        }
        await fetchGroups();
        await fetchRecords();
      } catch (err) {
        console.error('Error deleting group:', err);
        error.value = err.message;
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/groups', {
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch groups');
        }
        groups.value = await response.json();
      } catch (err) {
        console.error('Error fetching groups:', err);
        error.value = err.message;
      }
    };

    const calculateOvertime = async () => {
      error.value = '';
      loading.value = true;
      try {
        // Validate inputs
        if (!store.state.monthly_salary) {
          throw new Error('Please set your monthly salary in Settings first');
        }
        if (
          end_hour.value === null ||
          end_hour.value === undefined ||
          end_hour.value === ''
        ) {
          throw new Error('Please enter an end hour');
        }
        if (
          minutes.value === null ||
          minutes.value === undefined ||
          minutes.value === ''
        ) {
          throw new Error('Please enter minutes');
        }

        const requestBody = {
          salary: store.state.monthly_salary,
          end_hour: Number(end_hour.value),
          minutes: Number(minutes.value),
        };

        console.log('Request body:', requestBody);
        console.log('Token:', store.state.token);

        const response = await fetch(
          'http://localhost:3000/api/overtime/calculate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to calculate overtime');
        }
        result.value = data.result;
      } catch (err) {
        console.error('Error in calculateOvertime:', err);
        error.value = err.message;
        result.value = null;
      } finally {
        loading.value = false;
      }
    };

    const saveRecord = async () => {
      saving.value = true;
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const response = await fetch('http://localhost:3000/api/overtime/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${store.state.token}`,
          },
          body: JSON.stringify({
            date: currentDate,
            salary: store.state.monthly_salary,
            end_hour: end_hour.value,
            minutes: minutes.value,
            calculated_pay: result.value,
            group_id: groups.value[0]?.id, // Add to the first group by default
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save record');
        }
        await fetchRecords();
        result.value = null;
        end_hour.value = 19;
        minutes.value = 0;
      } catch (err) {
        console.error('Error saving record:', err);
        error.value = err.message;
      } finally {
        saving.value = false;
      }
    };

    const fetchRecords = async () => {
      loadingRecords.value = true;
      try {
        const token = store.state.token;
        console.log('Current token:', token);
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await fetch('http://localhost:3000/api/overtime', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch records');
        }
        records.value = await response.json();
      } catch (err) {
        console.error('Fetch records error:', err);
        error.value = err.message;
      } finally {
        loadingRecords.value = false;
      }
    };

    const deleteRecord = async (recordId) => {
      deletingId.value = recordId;
      try {
        const response = await fetch(
          `http://localhost:3000/api/overtime/${recordId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete record');
        }
        await fetchRecords();
      } catch (err) {
        console.error('Error deleting record:', err);
        error.value = err.message;
      } finally {
        deletingId.value = null;
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
    };

    onMounted(async () => {
      await Promise.all([fetchGroups(), fetchRecords()]);
    });

    return {
      store,
      end_hour,
      minutes,
      result,
      error,
      loading,
      saving,
      records,
      groups,
      loadingRecords,
      deletingId,
      showNewGroupModal,
      newGroupName,
      creatingGroup,
      editingGroup,
      updatingGroup,
      collapsedGroups,
      calculateOvertime,
      saveRecord,
      deleteRecord,
      formatDate,
      getGroupRecords,
      getGroupTotal,
      toggleGroup,
      createGroup,
      editGroup,
      updateGroup,
      deleteGroup,
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

.records-section {
  position: relative;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.new-group-button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-item {
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  cursor: pointer;
}

.group-name {
  font-weight: bold;
}

.group-total {
  color: #4caf50;
  margin-left: 0.5rem;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.group-records {
  padding: 1rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 300px;
}

.modal-content form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-content button {
  margin-top: 1rem;
}

.edit-button {
  padding: 0.5rem 1rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading,
.no-records {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
