const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');

// 数据库文件路径（相对于项目根目录）
const dbPath = path.join(__dirname, '../database/database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('已连接到资料管理数据库');
    }
});

// ==================== PUT /api/manage/:id ====================
// 更新资料（支持 title, remark, favorite 字段）
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { title, remark, favorite } = req.body;

    // 检查是否有字段被传递
    if (title === undefined && remark === undefined && favorite === undefined) {
        return res.status(400).json({ error: '至少需要提供一个更新字段' });
    }

    // 先查询资料是否存在
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('查询失败:', err.message);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (!row) {
            return res.status(404).json({ error: '资料不存在' });
        }

        // 动态构建更新字段
        const fields = [];
        const values = [];
        if (title !== undefined) {
            fields.push('title = ?');
            values.push(title);
        }
        if (remark !== undefined) {
            fields.push('remark = ?');
            values.push(remark);
        }
        if (favorite !== undefined) {
            const fav = favorite ? 1 : 0;
            fields.push('favorite = ?');
            values.push(fav);
        }
        values.push(id);

        const sql = `UPDATE resources SET ${fields.join(', ')} WHERE id = ?`;

        db.run(sql, values, function(err) {
            if (err) {
                console.error('更新失败:', err.message);
                return res.status(500).json({ error: '更新资料失败' });
            }
            db.get('SELECT * FROM resources WHERE id = ?', [id], (err, updatedRow) => {
                if (err) {
                    console.error('获取更新后资料失败:', err.message);
                    return res.status(500).json({ error: '更新成功但获取详情失败' });
                }
                res.json(updatedRow);
            });
        });
    });
});

// ==================== DELETE /api/manage/:id ====================
// 删除资料
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('查询失败:', err.message);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (!row) {
            return res.status(404).json({ error: '资料不存在' });
        }

        db.run('DELETE FROM resources WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('删除失败:', err.message);
                return res.status(500).json({ error: '删除资料失败' });
            }
            res.json({ success: true, deleted: row });
        });
    });
});

// ==================== GET /api/manage (测试用) ====================
router.get('/', (req, res) => {
    res.json({ status: 'TODO' });
});

module.exports = router;
