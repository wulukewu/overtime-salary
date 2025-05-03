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
router.get('/', authenticate, (req, res) => {
  const userId = req.userId;

  db.all(
    'SELECT * FROM overtime_records WHERE user_id = ? ORDER BY date DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Create a new overtime record
router.post('/', authenticate, (req, res) => {
  const userId = req.userId;
  const { date, salary, end_hour, minutes, calculated_pay } = req.body;

  console.log('Received save request:', {
    userId,
    date,
    salary,
    end_hour,
    minutes,
    calculated_pay,
  });

  // Check for missing fields
  const missingFields = [];
  if (date === undefined || date === null || date === '')
    missingFields.push('date');
  if (salary === undefined || salary === null) missingFields.push('salary');
  if (end_hour === undefined || end_hour === null)
    missingFields.push('end_hour');
  if (minutes === undefined || minutes === null) missingFields.push('minutes');
  if (calculated_pay === undefined || calculated_pay === null)
    missingFields.push('calculated_pay');

  if (missingFields.length > 0) {
    console.log('Missing fields:', missingFields);
    return res.status(400).json({
      error: 'Missing required fields',
      missingFields,
    });
  }

  // Validate data types
  if (isNaN(Number(salary))) {
    console.log('Invalid salary:', salary);
    return res.status(400).json({ error: 'Invalid salary format' });
  }
  if (isNaN(Number(end_hour))) {
    console.log('Invalid end_hour:', end_hour);
    return res.status(400).json({ error: 'Invalid end_hour format' });
  }
  if (isNaN(Number(minutes))) {
    console.log('Invalid minutes:', minutes);
    return res.status(400).json({ error: 'Invalid minutes format' });
  }
  if (isNaN(Number(calculated_pay))) {
    console.log('Invalid calculated_pay:', calculated_pay);
    return res.status(400).json({ error: 'Invalid calculated_pay format' });
  }

  // Convert to numbers
  const numSalary = Number(salary);
  const numEndHour = Number(end_hour);
  const numMinutes = Number(minutes);
  const numCalculatedPay = Number(calculated_pay);

  console.log('Converted values:', {
    salary: numSalary,
    end_hour: numEndHour,
    minutes: numMinutes,
    calculated_pay: numCalculatedPay,
  });

  db.run(
    'INSERT INTO overtime_records (user_id, date, salary, end_hour, minutes, calculated_pay) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, date, numSalary, numEndHour, numMinutes, numCalculatedPay],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        return res
          .status(500)
          .json({ error: 'Failed to save record', details: err.message });
      }
      console.log('Record saved successfully:', {
        id: this.lastID,
        user_id: userId,
        date,
        salary: numSalary,
        end_hour: numEndHour,
        minutes: numMinutes,
        calculated_pay: numCalculatedPay,
      });
      res.status(201).json({
        id: this.lastID,
        user_id: userId,
        date,
        salary: numSalary,
        end_hour: numEndHour,
        minutes: numMinutes,
        calculated_pay: numCalculatedPay,
      });
    }
  );
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

module.exports = router;
