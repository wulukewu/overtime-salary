const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'overtime.db');
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  if (!dbExists) {
    console.log('Database does not exist. Initializing...');

    // Table for overtime records (later we'll link users)
    db.run(`
      CREATE TABLE overtime_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        salary REAL NOT NULL,
        end_hour INTEGER NOT NULL,
        minutes INTEGER NOT NULL,
        calculated_pay REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Initialized base overtime_records table.');
  } else {
    console.log('Database already exists. Skipping initialization.');
  }
});

db.close();
