const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '../database/database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('数据库连接失败:', err.message);
});

// GET /api/resources - 获取所有资料列表
router.get('/', (req, res) => {
    db.all('SELECT * FROM resources ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('查询失败:', err.message);
            return res.status(500).json({ error: '查询资料失败' });
        }
        res.json(rows);
    });
});

// GET /api/resources/:id - 获取单个资料详情
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('查询失败:', err.message);
            return res.status(500).json({ error: '查询资料失败' });
        }
        if (!row) {
            return res.status(404).json({ error: '资料不存在' });
        }
        res.json(row);
    });
});

module.exports = router;