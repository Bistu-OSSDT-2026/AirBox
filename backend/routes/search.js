const express = require('express');
const router = express.Router();
const { getDb } = require('../database/connection');

/**
 * 统一响应格式
 */
function jsonResult(res, code, msg, data = null) {
    return res.json({ code, msg, data });
}

/**
 * GET /api/search
 * 多条件资料搜索：关键词模糊检索、标签筛选、上传时间排序、分页
 *
 * 查询参数：
 *   keyword  - 关键词，模糊匹配 title 和 content
 *   tags     - 标签名，逗号分隔，匹配资源 tags 字段中包含的任一标签
 *   sort     - 排序方式：newest（默认，降序）/ oldest（升序）
 *   page     - 页码，默认 1
 *   limit    - 每页条数，默认 20
 */
router.get('/', (req, res) => {
    const keyword = (req.query.keyword || '').trim();
    const tagsStr = (req.query.tags || '').trim();
    const sort = req.query.sort || 'newest';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    // 关键词模糊检索
    if (keyword) {
        conditions.push('(title LIKE ? OR content LIKE ?)');
        params.push('%' + keyword + '%', '%' + keyword + '%');
    }

    // 标签筛选：每个标签名分别用 LIKE 匹配
    if (tagsStr) {
        const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
            tags.forEach(tag => {
                conditions.push('tags LIKE ?');
                params.push('%' + tag + '%');
            });
        }
    }

    const whereClause = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

    // 排序
    const orderBy = sort === 'oldest'
        ? 'ORDER BY created_at ASC'
        : 'ORDER BY created_at DESC';

    const db = getDb();

    // 先查总数
    const countSql = 'SELECT COUNT(*) AS total FROM resources ' + whereClause;
    db.get(countSql, params, (err, row) => {
        if (err) {
            console.error('搜索失败:', err.message);
            return jsonResult(res, 500, '搜索失败，请稍后重试');
        }

        const total = row ? row.total : 0;

        // 再查分页数据
        const dataSql = 'SELECT * FROM resources ' + whereClause + ' ' + orderBy + ' LIMIT ? OFFSET ?';
        const dataParams = params.concat([limit, offset]);

        db.all(dataSql, dataParams, (err2, rows) => {
            if (err2) {
                console.error('搜索失败:', err2.message);
                return jsonResult(res, 500, '搜索失败，请稍后重试');
            }

            return jsonResult(res, 200, '查询成功', {
                total: total,
                page: page,
                limit: limit,
                list: rows || []
            });
        });
    });
});

module.exports = router;
