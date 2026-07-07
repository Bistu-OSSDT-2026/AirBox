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
 * 解析 tags 文本为标签数组，去空白项
 */
function parseTags(tagsStr) {
    if (!tagsStr) return [];
    return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * 将标签数组序列化为逗号分隔字符串
 */
function serializeTags(tagsArr) {
    return [...new Set(tagsArr.map(t => t.trim()).filter(Boolean))].join(',');
}

// ======================== 标签接口 ========================

/**
 * GET /api/manage/tags
 * 查询所有标签，去重并统计每个标签下的资源数量，按数量降序排列
 */
router.get('/tags', (req, res) => {
    const db = getDb();
    const sql = 'SELECT tags FROM resources WHERE tags IS NOT NULL AND tags != ""';

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('查询标签失败:', err.message);
            return jsonResult(res, 500, '查询标签失败，请稍后重试');
        }

        // 统计每个标签出现的次数
        const tagCount = {};
        rows.forEach(row => {
            const tags = parseTags(row.tags);
            tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });

        // 转为数组并按数量降序排列
        const tagList = Object.entries(tagCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return jsonResult(res, 200, '查询成功', tagList);
    });
});

/**
 * POST /api/manage/tags
 * 给指定资源添加一个标签
 *
 * 请求体：{ "resource_id": 1, "name": "工作" }
 */
router.post('/tags', (req, res) => {
    const resourceId = parseInt(req.body.resource_id);
    const tagName = (req.body.name || '').trim();

    if (!resourceId || !tagName) {
        return jsonResult(res, 400, '缺少必要参数 resource_id 或 name');
    }

    const db = getDb();

    // 查询资源是否存在
    db.get('SELECT id, tags FROM resources WHERE id = ?', [resourceId], (err, row) => {
        if (err) {
            console.error('查询资源失败:', err.message);
            return jsonResult(res, 500, '操作失败，请稍后重试');
        }

        if (!row) {
            return jsonResult(res, 404, '资源不存在');
        }

        // 检查标签是否已存在
        const currentTags = parseTags(row.tags);
        if (currentTags.includes(tagName)) {
            return jsonResult(res, 200, '标签已存在', { tags: row.tags });
        }

        // 追加新标签
        currentTags.push(tagName);
        const newTags = serializeTags(currentTags);

        db.run('UPDATE resources SET tags = ? WHERE id = ?', [newTags, resourceId], (err2) => {
            if (err2) {
                console.error('更新标签失败:', err2.message);
                return jsonResult(res, 500, '添加标签失败，请稍后重试');
            }

            return jsonResult(res, 200, '标签添加成功', { tags: newTags });
        });
    });
});

/**
 * DELETE /api/manage/tags/:name
 * 从所有资源中移除指定标签
 *
 * 路径参数：name - 标签名
 */
router.delete('/tags/:name', (req, res) => {
    const tagName = decodeURIComponent(req.params.name);

    if (!tagName) {
        return jsonResult(res, 400, '缺少标签名称');
    }

    const db = getDb();

    // 查询所有包含该标签的资源
    db.all('SELECT id, tags FROM resources WHERE tags LIKE ?', ['%' + tagName + '%'], (err, rows) => {
        if (err) {
            console.error('查询资源失败:', err.message);
            return jsonResult(res, 500, '删除标签失败，请稍后重试');
        }

        if (!rows || rows.length === 0) {
            return jsonResult(res, 200, '标签删除成功', { affected: 0 });
        }

        let affected = 0;

        // 逐条更新，从 tags 字段中移除该标签
        const updateNext = (index) => {
            if (index >= rows.length) {
                return jsonResult(res, 200, '标签删除成功', { affected: affected });
            }

            const row = rows[index];
            const currentTags = parseTags(row.tags);
            const newTags = serializeTags(currentTags.filter(t => t !== tagName));

            db.run('UPDATE resources SET tags = ? WHERE id = ?', [newTags, row.id], (err2) => {
                if (!err2) affected++;
                updateNext(index + 1);
            });
        };

        updateNext(0);
    });
});

module.exports = router;
