const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { all, get, run } = require('../database');
const authenticate = require('../auth');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key';

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const row = await get('SELECT is_admin FROM users WHERE id = ?', [
      req.userId,
    ]);
    if (!row || !row.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ error: 'Email, username, and password are required' });
    }

    // Check if email or username already exists
    const existingUser = await get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? 'Email already exists'
            : 'Username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await run(
      'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
      [email, username, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      id: result.lastID,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    console.log('Login attempt:', { login, password });

    if (!login || !password) {
      console.log('Missing credentials:', { login, password });
      return res.status(400).json({ error: 'Login and password are required' });
    }

    // Find user by email or username
    const user = await get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [login, login]
    );
    console.log('User found:', user);

    if (!user) {
      console.log('No user found for login:', login);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', login);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.is_admin,
      },
      process.env.JWT_SECRET || 'your-secret-jwt-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', login);
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error stack:', error.stack);
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get user's current password
    const user = await get('SELECT password FROM users WHERE id = ?', [
      req.userId,
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await run('UPDATE users SET password = ? WHERE id = ?', [
      hashedPassword,
      req.userId,
    ]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Error updating password' });
  }
});

// Admin: Get all users
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await all('SELECT id, username, email, is_admin FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Admin: Reset user password
router.post(
  '/users/:id/reset-password',
  authenticate,
  isAdmin,
  async (req, res) => {
    const { id } = req.params;
    const newPassword = Math.random().toString(36).slice(-8); // Generate random password

    try {
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await run(
        'UPDATE users SET password = ?, force_password_change = 1 WHERE id = ?',
        [hashedPassword, id]
      );

      res.json({
        message: 'Password reset successfully',
        newPassword, // In production, this should be sent via email
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Error resetting password' });
    }
  }
);

// Admin: Delete user
router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Update user profile
router.put('/profile', authenticate, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    'UPDATE users SET name = ? WHERE id = ?',
    [name, req.userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, email, username, is_admin FROM users WHERE id = ?',
      [req.userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT monthly_salary FROM users WHERE id = ?', [
      req.userId,
    ]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ monthly_salary: user.monthly_salary || 0 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/settings', authenticate, async (req, res) => {
  const { monthly_salary } = req.body;

  if (monthly_salary === undefined || monthly_salary === null) {
    return res.status(400).json({ error: 'Monthly salary is required' });
  }

  const salary = Number(monthly_salary);
  if (isNaN(salary) || salary < 0) {
    return res.status(400).json({ error: 'Invalid monthly salary' });
  }

  try {
    await run('UPDATE users SET monthly_salary = ? WHERE id = ?', [
      salary,
      req.userId,
    ]);
    res.json({ monthly_salary: salary });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin: Change user role
router.put('/users/:id/role', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_admin } = req.body;

  if (is_admin === undefined) {
    return res.status(400).json({ error: 'is_admin field is required' });
  }

  try {
    // Check if user exists
    const user = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role
    await run('UPDATE users SET is_admin = ? WHERE id = ?', [
      is_admin ? 1 : 0,
      id,
    ]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Error updating user role' });
  }
});

// Admin: Set user password
router.post(
  '/users/:id/set-password',
  authenticate,
  isAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long' });
    }

    try {
      // Check if user exists
      const user = await get('SELECT id FROM users WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Update password
      await run('UPDATE users SET password = ? WHERE id = ?', [
        hashedPassword,
        id,
      ]);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(500).json({ error: 'Error setting password' });
    }
  }
);

module.exports = router;
