const express = require('express');
const router = express.Router();

// TODO: 实现搜索相关接口
// 例如：GET /api/search?q=keyword - 搜索资源

router.get('/', (req, res) => {
    res.json({ status: 'TODO' });
});

module.exports = router;
