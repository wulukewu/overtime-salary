const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');

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
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Create overtime_records table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS overtime_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          group_id INTEGER,
          date TEXT NOT NULL,
          salary REAL NOT NULL,
          end_hour INTEGER NOT NULL,
          minutes INTEGER NOT NULL,
          calculated_pay INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (group_id) REFERENCES groups(id)
        )
      `,
        async (err) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Create admin user if not exists
            const adminCheck = await db.get(
              'SELECT * FROM users WHERE is_admin = 1'
            );
            if (!adminCheck) {
              const hashedPassword = await bcrypt.hash('admin', SALT_ROUNDS);
              await db.run(
                'INSERT INTO users (email, username, password, is_admin) VALUES (?, ?, ?, ?)',
                ['admin@system.local', 'admin', hashedPassword, 1]
              );
              console.log('Admin user created');
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        }
      );
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
