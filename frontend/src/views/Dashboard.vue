/* eslint-disable vue/no-unused-vars */
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
        <div v-else class="groups-container">
          <draggable
            v-model="groups"
            group="groups"
            @end="onGroupDragEnd"
            item-key="id"
            :animation="150"
            ghost-class="ghost-card"
          >
            <template #item="{ element: group }">
              <div class="group-item">
                <div class="group-header" @click="toggleGroup(group)">
                  <div class="group-name">
                    <span class="collapse-icon">{{
                      group.collapsed ? '▶' : '▼'
                    }}</span>
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
                      class="delete-button group-delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div
                  v-if="!group.collapsed"
                  class="group-records"
                  :data-group-id="group.id"
                >
                  <draggable
                    :list="groupRecordRefs[group.id]"
                    group="records"
                    @end="onDragEnd"
                    item-key="id"
                    class="records-container"
                    :animation="150"
                    ghost-class="ghost-card"
                    :data-group-id="group.id"
                  >
                    <template #item="{ element: record }">
                      <div class="record-card" :data-id="record.id">
                        <div class="record-header">
                          <div class="record-date">
                            {{ formatDate(record.date) }}
                          </div>
                          <div class="record-actions">
                            <button
                              @click="editRecord(record)"
                              class="edit-button"
                            >
                              Edit
                            </button>
                            <button
                              class="delete-button record-delete-button"
                              @click="deleteRecord(record.id)"
                              :disabled="deletingId === record.id"
                            >
                              {{
                                deletingId === record.id
                                  ? 'Deleting...'
                                  : 'Delete'
                              }}
                            </button>
                          </div>
                        </div>
                        <div class="record-details">
                          <div class="detail-item">
                            <span class="detail-label">Salary:</span>
                            <span class="detail-value">{{
                              record.salary
                            }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">End Hour:</span>
                            <span class="detail-value">{{
                              record.end_hour
                            }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Minutes:</span>
                            <span class="detail-value">{{
                              record.minutes
                            }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Pay:</span>
                            <span class="detail-value pay-value">{{
                              record.calculated_pay
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </template>
          </draggable>
          <!-- Ungrouped records -->
          <div class="group-item">
            <div class="group-header" @click="toggleGroup({ id: undefined })">
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
              data-group-id="null"
            >
              <draggable
                :list="groupRecordRefs['ungrouped']"
                group="records"
                @end="onDragEnd"
                item-key="id"
                class="records-container"
                :animation="150"
                ghost-class="ghost-card"
                :data-group-id="null"
              >
                <template #item="{ element: record }">
                  <div class="record-card" :data-id="record.id">
                    <div class="record-header">
                      <div class="record-date">
                        {{ formatDate(record.date) }}
                      </div>
                      <div class="record-actions">
                        <button @click="editRecord(record)" class="edit-button">
                          Edit
                        </button>
                        <button
                          class="delete-button record-delete-button"
                          @click="deleteRecord(record.id)"
                          :disabled="deletingId === record.id"
                        >
                          {{
                            deletingId === record.id ? 'Deleting...' : 'Delete'
                          }}
                        </button>
                      </div>
                    </div>
                    <div class="record-details">
                      <div class="detail-item">
                        <span class="detail-label">Salary:</span>
                        <span class="detail-value">{{ record.salary }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">End Hour:</span>
                        <span class="detail-value">{{ record.end_hour }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Minutes:</span>
                        <span class="detail-value">{{ record.minutes }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Pay:</span>
                        <span class="detail-value pay-value">{{
                          record.calculated_pay
                        }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
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

      <!-- Edit Record Modal -->
      <div v-if="editingRecord" class="modal">
        <div class="modal-content">
          <h3>Edit Record</h3>
          <form @submit.prevent="updateRecord">
            <div class="form-group">
              <label for="editDate">Date:</label>
              <input
                type="date"
                id="editDate"
                v-model="editingRecord.date"
                required
              />
            </div>
            <div class="form-group">
              <label for="editSalary">Salary:</label>
              <input
                type="number"
                id="editSalary"
                v-model.number="editingRecord.salary"
                required
              />
            </div>
            <div class="form-group">
              <label for="editEndHour">End Hour (24h):</label>
              <input
                type="number"
                id="editEndHour"
                v-model.number="editingRecord.end_hour"
                required
                min="19"
                max="23"
              />
            </div>
            <div class="form-group">
              <label for="editMinutes">Minutes:</label>
              <input
                type="number"
                id="editMinutes"
                v-model.number="editingRecord.minutes"
                required
                min="0"
                max="59"
              />
            </div>
            <div class="form-group">
              <label for="editGroup">Group:</label>
              <select id="editGroup" v-model="editingRecord.group_id">
                <option :value="null">Ungrouped</option>
                <option
                  v-for="group in groups"
                  :key="group.id"
                  :value="group.id"
                >
                  {{ group.name }}
                </option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="submit" :disabled="updatingRecord">
                {{ updatingRecord ? 'Updating...' : 'Update' }}
              </button>
              <button type="button" @click="editingRecord = null">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
/* eslint-enable vue/no-unused-vars */

<script>
/* eslint-disable vue/no-unused-vars */
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import draggable from 'vuedraggable';
import config from '../config';

export default {
  name: 'OvertimeDashboard',
  components: {
    draggable,
  },
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
    const editingRecord = ref(null);
    const updatingRecord = ref(false);

    const groupRecordRefs = computed(() => {
      const map = {};
      groups.value.forEach((group) => {
        map[group.id] = records.value.filter((r) => r.group_id === group.id);
      });
      map['ungrouped'] = records.value.filter((r) => !r.group_id);
      return map;
    });

    const getGroupRecords = (groupId) => {
      if (groupId === 'ungrouped') {
        return records.value
          .filter((record) => !record.group_id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
      return records.value
        .filter((record) => record.group_id === groupId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    };

    const getGroupTotal = (groupId) => {
      const groupRecords = getGroupRecords(groupId);
      return groupRecords.reduce(
        (sum, record) => sum + record.calculated_pay,
        0
      );
    };

    const fetchUngroupedCollapsed = async () => {
      try {
        const response = await fetch(
          `${config.apiUrl}/api/groups/ungrouped-collapsed`,
          {
            headers: {
              Authorization: `Bearer ${store.state.token}`,
            },
          }
        );
        if (!response.ok)
          throw new Error('Failed to fetch ungrouped collapsed state');
        const data = await response.json();
        if (data.ungrouped_collapsed) {
          if (!collapsedGroups.value.includes('ungrouped')) {
            collapsedGroups.value.push('ungrouped');
          }
        } else {
          collapsedGroups.value = collapsedGroups.value.filter(
            (id) => id !== 'ungrouped'
          );
        }
      } catch (err) {
        console.error('Error fetching ungrouped collapsed state:', err);
      }
    };

    const updateUngroupedCollapsed = async (collapsed) => {
      try {
        await fetch(`${config.apiUrl}/api/groups/ungrouped-collapsed`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${store.state.token}`,
          },
          body: JSON.stringify({ collapsed }),
        });
      } catch (err) {
        console.error('Error updating ungrouped collapsed state:', err);
      }
    };

    const toggleGroup = async (group) => {
      // Handle ungrouped group (persist state in DB)
      if (group === 'ungrouped' || group.id === undefined) {
        const idx = collapsedGroups.value.indexOf('ungrouped');
        const newCollapsed = idx === -1;
        if (newCollapsed) {
          collapsedGroups.value.push('ungrouped');
        } else {
          collapsedGroups.value.splice(idx, 1);
        }
        await updateUngroupedCollapsed(newCollapsed);
        return;
      }
      try {
        const response = await fetch(
          `${config.apiUrl}/api/groups/${group.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({
              collapsed: !group.collapsed,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update group state');
        }

        // Update local state
        group.collapsed = !group.collapsed;
      } catch (err) {
        console.error('Error toggling group:', err);
        error.value = err.message;
      }
    };

    const createGroup = async () => {
      creatingGroup.value = true;
      try {
        const response = await fetch(`${config.apiUrl}/api/groups`, {
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
          `${config.apiUrl}/api/groups/${editingGroup.value.id}`,
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
        const response = await fetch(`${config.apiUrl}/api/groups/${groupId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });
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
        const response = await fetch(`${config.apiUrl}/api/groups`, {
          headers: {
            Authorization: `Bearer ${store.state.token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch groups');
        }
        groups.value = await response.json();
        // Initialize collapsed groups from the database
        collapsedGroups.value = groups.value
          .filter((group) => group.collapsed)
          .map((group) => group.id);
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
          `${config.apiUrl}/api/overtime/calculate`,
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
        const response = await fetch(`${config.apiUrl}/api/overtime/`, {
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
        const response = await fetch(`${config.apiUrl}/api/overtime`, {
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
          `${config.apiUrl}/api/overtime/${recordId}`,
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

    const editRecord = (record) => {
      editingRecord.value = { ...record };
    };

    const updateRecord = async () => {
      updatingRecord.value = true;
      try {
        const response = await fetch(
          `${config.apiUrl}/api/overtime/${editingRecord.value.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify(editingRecord.value),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update record');
        }
        await fetchRecords();
        editingRecord.value = null;
      } catch (err) {
        console.error('Error updating record:', err);
        error.value = err.message;
      } finally {
        updatingRecord.value = false;
      }
    };

    const onDragEnd = async (evt) => {
      console.log('Drag ended:', evt);

      // Get the record ID from the dragged item
      const recordId = parseInt(evt.item.getAttribute('data-id'));
      if (!recordId) {
        console.error('No record ID found on dragged item');
        return;
      }

      // Get the source and target group IDs
      const fromGroupId = evt.from.getAttribute('data-group-id');
      const toGroupId = evt.to.getAttribute('data-group-id');

      console.log('Moving record:', {
        recordId,
        fromGroupId,
        toGroupId,
        fromElement: evt.from,
        toElement: evt.to,
        newIndex: evt.newIndex,
      });

      try {
        // Find the record in our local state
        const record = records.value.find((r) => r.id === recordId);
        if (!record) {
          throw new Error('Record not found');
        }

        // Calculate the new sort order
        let newSortOrder = evt.newIndex;

        const updateData = {
          ...record,
          group_id: toGroupId === 'null' ? null : parseInt(toGroupId),
          sort_order: newSortOrder,
        };

        console.log('Sending update data:', updateData);

        // Update the record's group_id and sort_order in the database
        const response = await fetch(
          `${config.apiUrl}/api/overtime/${recordId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update record');
        }

        console.log('Record updated successfully');
        // Refresh the records to reflect the change
        await fetchRecords();
      } catch (error) {
        console.error('Error updating record:', error);
        // Revert the drag operation by refreshing the records
        await fetchRecords();
      }
    };

    const onGroupDragEnd = async (evt) => {
      if (!evt.moved) return;

      const { element: group, newIndex } = evt.moved;
      const newSortOrder = newIndex + 1;

      try {
        const response = await fetch(
          `${config.apiUrl}/api/groups/${group.id}/sort`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${store.state.token}`,
            },
            body: JSON.stringify({ sort_order: newSortOrder }),
          }
        );

        if (!response.ok) {
          console.error('Failed to update group sort order');
          await fetchGroups(); // Refresh groups to revert the change
        }
      } catch (error) {
        console.error('Error updating group sort order:', error);
        await fetchGroups(); // Refresh groups to revert the change
      }
    };

    onMounted(async () => {
      await Promise.all([fetchGroups(), fetchRecords()]);
      await fetchUngroupedCollapsed();
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
      editingRecord,
      updatingRecord,
      editRecord,
      updateRecord,
      onDragEnd,
      onGroupDragEnd,
      groupRecordRefs,
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
  transition: background 0.2s;
}
.new-group-button:hover {
  background-color: #357a38;
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  padding: 1rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.group-header:hover {
  background: #e9ecef;
}

.group-header h3 {
  margin: 0;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.group-actions button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.group-actions button:hover {
  background-color: #dee2e6;
}

.group-records {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 0.5rem;
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
  transition: background 0.2s;
}
.edit-button:hover {
  background-color: #1769aa;
}

.save-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.save-button:hover {
  background-color: #357a38;
}

.cancel-button {
  background-color: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-button:hover {
  background-color: #bdbdbd;
}

.group-delete-button {
  background-color: #f44336;
  color: white;
  transition: background 0.2s;
}
.group-delete-button:hover {
  background-color: #aa2e25;
}

.record-delete-button {
  background-color: #ff9800;
  color: white;
  transition: background 0.2s;
}
.record-delete-button:hover {
  background-color: #c66900;
}

.loading,
.no-records {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.delete-button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  color: white;
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.records-container {
  min-height: 50px;
  padding: 1rem;
  background-color: #fff;
  border-radius: 4px;
  border: 1px dashed #ddd;
}

.record-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
  transition: transform 0.2s;
  cursor: move;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.record-card.sortable-ghost {
  opacity: 0.5;
  background: #e0e0e0;
}

.record-card.sortable-drag {
  opacity: 0.5;
  background: #e0e0e0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.record-actions {
  display: flex;
  gap: 0.5rem;
}

.record-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  color: #666;
}

.detail-value {
  font-weight: bold;
}

.pay-value {
  color: #4caf50;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
}

.ghost-card {
  opacity: 0.5;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
}

.collapse-icon {
  display: inline-block;
  margin-right: 8px;
  font-size: 12px;
  transition: transform 0.2s;
}
</style>
