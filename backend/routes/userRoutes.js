const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = new sqlite3.Database('./database.sqlite');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key';

// Middleware to authenticate the user using JWT
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  db.get(
    'SELECT is_admin FROM users WHERE id = ?',
    [req.userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row || !row.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    }
  );
};

// User registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    db.get(
      'SELECT id FROM users WHERE email = ?',
      [email],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        db.run(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword],
          function (err) {
            if (err) {
              return res.status(500).json({ error: 'Error creating user' });
            }

            const token = jwt.sign(
              {
                id: this.lastID,
                email: email,
                isAdmin: false,
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              token,
              user: {
                id: this.lastID,
                name,
                email,
                is_admin: false,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            isAdmin: user.is_admin === 1,
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            is_admin: user.is_admin === 1,
          },
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT password FROM users WHERE id = ?',
        [req.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Error updating password' });
  }
});

// Admin: Get all users
router.get('/users', authenticate, isAdmin, (req, res) => {
  db.all('SELECT id, name, email, is_admin FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching users' });
    }
    res.json(users);
  });
});

// Admin: Reset user password
router.post('/users/:id/reset-password', authenticate, isAdmin, (req, res) => {
  const { id } = req.params;
  const newPassword = Math.random().toString(36).slice(-8); // Generate random password

  bcrypt.hash(newPassword, SALT_ROUNDS, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    db.run(
      'UPDATE users SET password = ?, force_password_change = 1 WHERE id = ?',
      [hashedPassword, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error resetting password' });
        }
        res.json({
          message: 'Password reset successfully',
          newPassword, // In production, this should be sent via email
        });
      }
    );
  });
});

// Admin: Delete user
router.delete('/users/:id', authenticate, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting user' });
    }
    res.json({ message: 'User deleted successfully' });
  });
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

// Protected route to get user profile
router.get('/profile', authenticate, (req, res) => {
  db.get(
    'SELECT id, name, email, is_admin FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Get user settings
router.get('/settings', authenticate, (req, res) => {
  db.get(
    'SELECT monthly_salary FROM users WHERE id = ?',
    [req.userId],
    (err, row) => {
      if (err) {
        console.error('Error fetching user settings:', err);
        return res.status(500).json({ error: 'Error fetching user settings' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ monthly_salary: row.monthly_salary || 0 });
    }
  );
});

// Update user settings
router.put('/settings', authenticate, (req, res) => {
  const { monthly_salary } = req.body;

  if (monthly_salary === undefined || monthly_salary === null) {
    return res.status(400).json({ error: 'Monthly salary is required' });
  }

  const salary = Number(monthly_salary);
  if (isNaN(salary) || salary < 0) {
    return res.status(400).json({ error: 'Invalid monthly salary' });
  }

  db.run(
    'UPDATE users SET monthly_salary = ? WHERE id = ?',
    [salary, req.userId],
    (err) => {
      if (err) {
        console.error('Error updating user settings:', err);
        return res.status(500).json({ error: 'Error updating user settings' });
      }
      res.json({ monthly_salary: salary });
    }
  );
});

module.exports = router;
