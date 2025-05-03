const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('./database').db;
const calculateOvertimePay = require('./overtimeCalculator');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key';

// Middleware to authenticate the user using JWT
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Get all overtime records for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const records = await db.all(
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
    if (!date || !salary || !end_hour || !minutes || !calculated_pay) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If group_id is provided, verify it belongs to the user
    if (group_id) {
      const group = await db.get(
        'SELECT * FROM groups WHERE id = ? AND user_id = ?',
        [group_id, userId]
      );
      if (!group) {
        return res.status(400).json({ error: 'Invalid group' });
      }
    }

    const result = await db.run(
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

  console.log('Received request body:', req.body);
  console.log('Parsed fields:', {
    salary: { value: salary, type: typeof salary },
    end_hour: { value: end_hour, type: typeof end_hour },
    minutes: { value: minutes, type: typeof minutes },
  });

  // Check for missing fields
  if (salary === undefined || salary === null) {
    return res.status(400).json({ error: 'Monthly salary is required' });
  }
  if (end_hour === undefined || end_hour === null) {
    return res.status(400).json({ error: 'End hour is required' });
  }
  if (minutes === undefined || minutes === null) {
    return res.status(400).json({ error: 'Minutes are required' });
  }

  // Convert to numbers and validate
  const salaryNum = Number(salary);
  const endHourNum = Number(end_hour);
  const minutesNum = Number(minutes);

  if (isNaN(salaryNum) || salaryNum < 0) {
    return res.status(400).json({ error: 'Invalid monthly salary' });
  }
  if (isNaN(endHourNum) || endHourNum < 19) {
    return res.status(400).json({ error: 'End hour must be 19 or later' });
  }
  if (isNaN(minutesNum) || minutesNum < 0 || minutesNum > 59) {
    return res.status(400).json({ error: 'Minutes must be between 0 and 59' });
  }

  // Calculate overtime pay
  const hourlyRate = salaryNum / 30 / 8; // Assuming 8 hours per day
  const overtimeHours = endHourNum - 19 + minutesNum / 60;
  const overtimePay = hourlyRate * overtimeHours * 1.5; // 1.5x for overtime

  console.log('Calculation result:', {
    hourlyRate,
    overtimeHours,
    overtimePay,
  });

  res.json({ result: Math.round(overtimePay * 100) / 100 });
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // First verify the record belongs to the user
    const record = await db.get(
      'SELECT * FROM overtime_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Delete the record
    await db.run('DELETE FROM overtime_records WHERE id = ?', [id]);
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;
