const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const db = new sqlite3.Database('./database.sqlite');

const router = express.Router();

// Middleware to authenticate the user using JWT
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.id; // Save user ID to request object
    next();
  });
};

// Create new overtime record
router.post('/overtime', authenticate, (req, res) => {
  const { date, salary, endHour, minutes } = req.body;

  if (!date || !salary || !endHour || !minutes) {
    return res
      .status(400)
      .json({
        error: 'Missing required fields: date, salary, endHour, minutes',
      });
  }

  // Insert overtime record for authenticated user
  db.run(
    'INSERT INTO overtime_records (user_id, date, salary, end_hour, minutes) VALUES (?, ?, ?, ?, ?)',
    [req.userId, date, salary, endHour, minutes],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error saving overtime record' });
      }
      res
        .status(201)
        .json({
          message: 'Overtime record created successfully!',
          id: this.lastID,
        });
    }
  );
});

module.exports = router;
