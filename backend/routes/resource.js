const express = require('express');
const router = express.Router();

// TODO: 实现资源管理相关接口
// 例如：GET /api/resources - 获取资源列表
// 例如：GET /api/resources/:id - 获取单个资源详情

router.get('/', (req, res) => {
    res.json({ status: 'TODO' });
});

module.exports = router;
