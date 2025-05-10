const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_FILE = path.join(dataDir, 'database.sqlite');
const SALT_ROUNDS = 10;

// Create database instance
const db = new sqlite3.Database(DB_FILE);

// Helper methods for database operations
const all = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          monthly_salary REAL DEFAULT 0,
          is_admin INTEGER DEFAULT 0,
          force_password_change INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ungrouped_collapsed INTEGER DEFAULT 0
        )
      `);

      // Create groups table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          collapsed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Create overtime_records table
      db.run(`
        CREATE TABLE IF NOT EXISTS overtime_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          salary REAL NOT NULL,
          end_hour INTEGER NOT NULL,
          minutes INTEGER NOT NULL,
          calculated_pay REAL NOT NULL,
          group_id INTEGER,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (group_id) REFERENCES groups(id)
        )
      `);

      // Check if database is empty
      db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        // If no users exist, create admin account
        if (row.count === 0) {
          try {
            const hashedPassword = await bcrypt.hash('admin', SALT_ROUNDS);
            await new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO users (email, username, password, is_admin, name) VALUES (?, ?, ?, ?, ?)',
                ['admin@system.local', 'admin', hashedPassword, 1, 'Admin'],
                function (err) {
                  if (err) reject(err);
                  else resolve(this);
                }
              );
            });
            console.log('Admin user created with credentials:');
            console.log('Email: admin@system.local');
            console.log('Username: admin');
            console.log('Password: admin');
          } catch (error) {
            console.error('Error creating admin user:', error);
            reject(error);
            return;
          }
        } else {
          // Check if admin user exists
          const admin = await get('SELECT * FROM users WHERE email = ?', [
            'admin@system.local',
          ]);

          if (!admin) {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin', SALT_ROUNDS);
            await run(
              'INSERT INTO users (email, username, password, is_admin, name) VALUES (?, ?, ?, ?, ?)',
              ['admin@system.local', 'admin', hashedPassword, 1, 'Admin']
            );
            console.log('Admin user created with credentials:');
            console.log('Email: admin@system.local');
            console.log('Username: admin');
            console.log('Password: admin');
          } else if (!admin.name) {
            // Update admin's name if it's not set
            await run('UPDATE users SET name = ? WHERE email = ?', [
              'Admin',
              'admin@system.local',
            ]);
            console.log('Admin name updated to "Admin"');
          }

          // Add name column if it doesn't exist
          try {
            await run('ALTER TABLE users ADD COLUMN name TEXT');
            console.log('Added name column to users table');
          } catch (error) {
            // Column might already exist, which is fine
            if (!error.message.includes('duplicate column name')) {
              throw error;
            }
          }

          // Set default names for existing users
          const users = await all(
            'SELECT id, username FROM users WHERE name IS NULL'
          );
          for (const user of users) {
            await run('UPDATE users SET name = ? WHERE id = ?', [
              user.username,
              user.id,
            ]);
            console.log(`Set default name for user ${user.username}`);
          }
        }

        resolve();
      });
    });
  });
};

// Export the database instance and helper methods
module.exports = {
  db,
  initDatabase,
  all,
  get,
  run,
};
