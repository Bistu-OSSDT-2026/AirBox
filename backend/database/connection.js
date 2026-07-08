const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/airbox.db');

let db = null;
let initPromise = null;

function getDb() {
    if (db) {
        return db;
    }

    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Failed to connect to database:', err.message);
        } else {
            console.log('Connected to SQLite database.');
        }
    });

    return db;
}

function initializeDb() {
    if (!db) {
        getDb();
    }

    if (!initPromise) {
        initPromise = new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('PRAGMA foreign_keys = ON;', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                });

                db.run(`
                    CREATE TABLE IF NOT EXISTS resources (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT,
                        type TEXT,
                        content TEXT,
                        file_url TEXT,
                        tags TEXT,
                        file_size INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    console.log('Resource table is ready.');
                    resolve();
                });
            });
        });
    }

    return initPromise;
}

module.exports = { getDb, initializeDb };
