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
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          monthly_salary REAL DEFAULT 0,
          is_admin INTEGER DEFAULT 0,
          force_password_change INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create overtime_records table
      db.run(`
        CREATE TABLE IF NOT EXISTS overtime_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          salary REAL NOT NULL,
          end_hour INTEGER NOT NULL,
          minutes INTEGER NOT NULL,
          calculated_pay REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Always check for admin user
      db.get(
        'SELECT id FROM users WHERE email = ?',
        ['admin@system.local'],
        (err, existingUser) => {
          if (err) {
            console.error('Error checking for admin user:', err);
            reject(err);
            return;
          }

          if (existingUser) {
            console.log('Admin user exists');
            resolve(db);
            return;
          }

          // Create admin user if it doesn't exist
          console.log('Creating admin user...');
          const defaultPassword = 'admin';
          bcrypt.hash(defaultPassword, SALT_ROUNDS, (err, hashedPassword) => {
            if (err) {
              console.error('Error hashing admin password:', err);
              reject(err);
              return;
            }

            db.run(
              'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
              ['Admin', 'admin@system.local', hashedPassword, 1],
              (err) => {
                if (err) {
                  console.error('Error creating admin user:', err);
                  reject(err);
                  return;
                }
                console.log(
                  'Admin user created (email: admin@system.local, password: admin)'
                );
                resolve(db);
              }
            );
          });
        }
      );
    });
  });
};

module.exports = {
  db,
  initDatabase,
};
