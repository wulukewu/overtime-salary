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
       ORDER BY r.date DESC`,
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
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { date, salary, end_hour, minutes, group_id } = req.body;

    // Validate required fields
    if (!date || !salary || !end_hour || minutes === undefined) {
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

    // Verify the record belongs to the user
    const record = await get(
      'SELECT * FROM overtime_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
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

    // Calculate new overtime pay
    const calculated_pay = calculateOvertimePay(salary, end_hour, minutes);

    // Update the record
    await run(
      `UPDATE overtime_records 
       SET date = ?, salary = ?, end_hour = ?, minutes = ?, 
           calculated_pay = ?, group_id = ?
       WHERE id = ? AND user_id = ?`,
      [date, salary, end_hour, minutes, calculated_pay, group_id, id, userId]
    );

    res.json({
      id,
      date,
      salary,
      end_hour,
      minutes,
      calculated_pay,
      group_id,
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

module.exports = router;
