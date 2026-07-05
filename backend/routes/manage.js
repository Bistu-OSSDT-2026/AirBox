const express = require('express');
const router = express.Router();

// TODO: 实现资源管理相关接口
// 例如：PUT /api/manage/:id - 更新资源信息
// 例如：DELETE /api/manage/:id - 删除资源

router.get('/', (req, res) => {
    res.json({ status: 'TODO' });
});

module.exports = router;
