const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/airbox.db');

let db = null;

function getDb() {
    if (db) {
        return db;
    }

    // 确保数据库目录存在
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

    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON;');

    // TODO: 在此处添加数据库表初始化代码
    // 例如：创建 resources 表、tags 表等

    return db;
}

module.exports = { getDb };
