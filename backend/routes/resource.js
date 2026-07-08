const { getDb } = require('../database/connection');

router.get('/', (req, res) => {
    const db = getDb();
    db.all('SELECT * FROM resources ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('查询资料列表失败:', err.message);
            return res.status(500).json({ error: '查询资料列表失败' });
        }
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    const db = getDb();
    const id = req.params.id;
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('查询资料详情失败:', err.message);
            return res.status(500).json({ error: '查询资料详情失败' });
        }
        if (!row) {
            return res.status(404).json({ error: '资料不存在' });
        }
        res.json(row);
    });
});