const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_FILE = './database.sqlite';
const SALT_ROUNDS = 10;

const initDatabase = async () => {
  const dbExists = fs.existsSync(DB_FILE);
  const db = new sqlite3.Database(DB_FILE);

  db.serialize(() => {
    // Ensure tables exist
    db.run(
      'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, is_admin INTEGER DEFAULT 0, force_password_change INTEGER DEFAULT 0)'
    );

    db.run(
      'CREATE TABLE IF NOT EXISTS overtime_records (id INTEGER PRIMARY KEY, user_id INTEGER, date TEXT, salary INTEGER, end_hour INTEGER, minutes INTEGER, calculated_pay INTEGER, FOREIGN KEY(user_id) REFERENCES users(id))'
    );
  });

  if (!dbExists) {
    console.log('Creating new database...');

    db.serialize(() => {
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

  return Promise.resolve(db);
};

module.exports = initDatabase;
