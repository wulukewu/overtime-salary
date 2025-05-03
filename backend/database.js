const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const DB_FILE = './database.sqlite';
const SALT_ROUNDS = 10;

// Create database instance
const db = new sqlite3.Database(DB_FILE);

const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          monthly_salary REAL DEFAULT 0,
          is_admin BOOLEAN DEFAULT 0,
          force_password_change INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                'INSERT INTO users (email, username, password, is_admin) VALUES (?, ?, ?, ?)',
                ['admin@system.local', 'admin', hashedPassword, 1],
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
        }

        resolve();
      });
    });
  });
};

// Export the database instance and initDatabase function
module.exports = {
  db,
  initDatabase,
  // Add helper methods for database operations
  all: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
};
