const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_FILE = './database.sqlite';
const SALT_ROUNDS = 10;

const initDatabase = async () => {
  const dbExists = fs.existsSync(DB_FILE);
  const db = new sqlite3.Database(DB_FILE);

  if (!dbExists) {
    console.log('Creating new database...');

    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          is_admin INTEGER DEFAULT 0,
          force_password_change INTEGER DEFAULT 0
        )
      `);

      // Overtime Records table
      db.run(`
        CREATE TABLE overtime_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          date TEXT,
          salary INTEGER,
          end_hour INTEGER,
          minutes INTEGER,
          calculated_pay INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Insert default admin
      const defaultPassword = 'admin';
      bcrypt.hash(defaultPassword, SALT_ROUNDS, (err, hashed) => {
        if (err) {
          console.error('Error hashing admin password:', err);
        } else {
          db.run(
            `
            INSERT INTO users (name, email, password, is_admin, force_password_change)
            VALUES (?, ?, ?, ?, ?)
          `,
            ['Admin', 'admin@system.local', hashed, 1, 1]
          );
          console.log(
            'Default admin user created. (username: admin@system.local, password: admin)'
          );
        }
      });
    });
  } else {
    console.log('Database already exists. Skipping setup.');
  }

  return db;
};

module.exports = initDatabase;
