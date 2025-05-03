const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('./database').db;
const { calculateOvertimePay } = require('./overtimeCalculator');

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
  const { date, salary, end_hour, minutes } = req.body;

  if (!date || !salary || !end_hour || !minutes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const calculated_pay = calculateOvertimePay(salary, end_hour, minutes);

  db.run(
    'INSERT INTO overtime_records (user_id, date, salary, end_hour, minutes, calculated_pay) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, date, salary, end_hour, minutes, calculated_pay],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        user_id: userId,
        date,
        salary,
        end_hour,
        minutes,
        calculated_pay,
      });
    }
  );
});

// Calculate overtime pay without saving
router.post('/calculate', authenticate, (req, res) => {
  const { salary, endHour, minutes } = req.body;

  if (!salary || !endHour || !minutes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = calculateOvertimePay(salary, endHour, minutes);
  res.json({ result });
});

module.exports = router;
