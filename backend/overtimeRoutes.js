const express = require('express');
const router = express.Router();
const { all, get, run } = require('./database');
const calculateOvertimePay = require('./overtimeCalculator');
const authenticate = require('./auth');

// Get all overtime records for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const records = await all(
      `SELECT r.*, g.name as group_name 
       FROM overtime_records r 
       LEFT JOIN groups g ON r.group_id = g.id 
       WHERE r.user_id = ? 
       ORDER BY r.group_id, r.sort_order ASC, r.date DESC`,
      [userId]
    );
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Create a new overtime record
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, salary, end_hour, minutes, calculated_pay, group_id } =
      req.body;
    const userId = req.userId;

    // Validate required fields
    if (
      !date ||
      !salary ||
      !end_hour ||
      minutes === undefined ||
      !calculated_pay
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate end_hour and minutes
    if (end_hour < 19) {
      return res.status(400).json({ error: 'End hour must be 19 or later' });
    }
    if (minutes < 0 || minutes > 59) {
      return res
        .status(400)
        .json({ error: 'Minutes must be between 0 and 59' });
    }

    // If group_id is provided, verify it belongs to the user
    if (group_id) {
      const group = await get(
        'SELECT * FROM groups WHERE id = ? AND user_id = ?',
        [group_id, userId]
      );
      if (!group) {
        return res.status(400).json({ error: 'Invalid group' });
      }
    }

    const result = await run(
      'INSERT INTO overtime_records (user_id, group_id, date, salary, end_hour, minutes, calculated_pay) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, group_id, date, salary, end_hour, minutes, calculated_pay]
    );

    res.status(201).json({
      id: result.lastID,
      date,
      salary,
      end_hour,
      minutes,
      calculated_pay,
      group_id,
    });
  } catch (error) {
    console.error('Error saving record:', error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// Calculate overtime pay
router.post('/calculate', (req, res) => {
  const { salary, end_hour, minutes } = req.body;

  if (!salary || !end_hour || minutes === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate end_hour and minutes
  if (end_hour < 19) {
    return res.status(400).json({ error: 'End hour must be 19 or later' });
  }
  if (minutes < 0 || minutes > 59) {
    return res.status(400).json({ error: 'Minutes must be between 0 and 59' });
  }

  const result = calculateOvertimePay(salary, end_hour, minutes);
  res.json({ result });
});

// Delete an overtime record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // First verify the record belongs to the user
    const record = await get(
      'SELECT * FROM overtime_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Delete the record
    await run('DELETE FROM overtime_records WHERE id = ?', [id]);
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Update an overtime record
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const {
    date,
    salary,
    end_hour,
    minutes,
    calculated_pay,
    group_id,
    sort_order,
  } = req.body;
  const userId = req.userId;

  console.log('Updating record:', {
    id,
    userId,
    group_id,
    sort_order,
    body: req.body,
  });

  try {
    // Validate required fields
    if (
      !date ||
      salary === undefined ||
      end_hour === undefined ||
      minutes === undefined ||
      calculated_pay === undefined
    ) {
      console.log('Missing required fields:', {
        date,
        salary,
        end_hour,
        minutes,
        calculated_pay,
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the record exists and belongs to the user
    const record = await get(
      'SELECT * FROM overtime_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      console.log('Record not found:', { id, userId });
      return res.status(404).json({ error: 'Record not found' });
    }

    // If group_id is provided, validate it belongs to the user
    if (group_id !== undefined) {
      const group = await get(
        'SELECT * FROM groups WHERE id = ? AND user_id = ?',
        [group_id, userId]
      );
      if (!group && group_id !== null) {
        console.log('Invalid group:', { group_id, userId });
        return res.status(400).json({ error: 'Invalid group' });
      }
    }

    // Start a transaction
    await run('BEGIN TRANSACTION');

    try {
      // If sort_order is provided, update the sort order for all records in the group
      if (sort_order !== undefined) {
        const currentGroupId =
          group_id !== undefined ? group_id : record.group_id;
        // Get all records in the group, ordered by sort_order
        const groupRecords = await all(
          'SELECT id FROM overtime_records WHERE group_id = ? AND user_id = ? ORDER BY sort_order ASC',
          [currentGroupId, userId]
        );
        // Remove the moved record from the array
        const movingIndex = groupRecords.findIndex(
          (r) => r.id === parseInt(id)
        );
        const [movedRecord] = groupRecords.splice(movingIndex, 1);
        // Insert it at the new index
        groupRecords.splice(sort_order, 0, movedRecord);
        // Update sort_order for all records in the group
        for (let i = 0; i < groupRecords.length; i++) {
          await run(
            'UPDATE overtime_records SET sort_order = ? WHERE id = ? AND user_id = ?',
            [i, groupRecords[i].id, userId]
          );
        }
      }

      // Update the record
      console.log('Updating record:', {
        id,
        date,
        salary,
        end_hour,
        minutes,
        calculated_pay,
        group_id,
      });

      await run(
        `UPDATE overtime_records 
         SET date = ?, salary = ?, end_hour = ?, minutes = ?, 
             calculated_pay = ?, group_id = ?
         WHERE id = ? AND user_id = ?`,
        [date, salary, end_hour, minutes, calculated_pay, group_id, id, userId]
      );

      await run('COMMIT');
      res.json({ message: 'Record updated successfully' });
    } catch (error) {
      console.error('Transaction error:', error);
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

module.exports = router;
