// ============================================================
// ZCode AI 生成 - Search 模块
// 职责: 关键词搜索 + 标签筛选 + 时间轴分段 + 时间区间 + 分页
// 标签增删/资源编辑删除 由 Manage 模块负责
// ============================================================

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/connection');

// ============================================================
// GET /api/search/tags — 获取去重标签列表
// ============================================================
router.get('/tags', (req, res) => {
    const db = getDb();
    db.all(`SELECT tags FROM resources WHERE tags IS NOT NULL AND tags != ''`, [], (err, rows) => {
        if (err) {
            console.error('Failed to fetch tags:', err.message);
            return res.status(500).json({ code: 1, message: '获取标签失败', data: [] });
        }
        const tagSet = new Set();
        rows.forEach(row => {
            if (row.tags) {
                row.tags.split(',').forEach(t => { const n = t.trim(); if (n) tagSet.add(n); });
            }
        });
        const tagList = Array.from(tagSet).sort().map((name, idx) => ({ id: idx + 1, name }));
        res.json({ code: 0, data: tagList });
    });
});

// ============================================================
// GET /api/search — 多维度搜索
// 入参: keyword, tags, start_date, end_date, page, page_size
// ============================================================
router.get('/', (req, res) => {
    const { keyword, tags, start_date, end_date } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = [];

    // 关键词模糊搜索 title + content
    if (keyword && keyword.trim()) {
        where += ` AND (r.title LIKE ? OR r.content LIKE ?)`;
        const kw = `%${keyword.trim()}%`;
        params.push(kw, kw);
    }

    // 标签精确筛选
    if (tags) {
        tags.split(',').map(t => t.trim()).filter(Boolean).forEach(tag => {
            where += ` AND (r.tags = ? OR r.tags LIKE ? OR r.tags LIKE ? OR r.tags LIKE ?)`;
            params.push(tag, `${tag},%`, `%,${tag}`, `%,${tag},%`);
        });
    }

    // 时间区间筛选
    if (start_date) { where += ` AND r.created_at >= ?`; params.push(start_date); }
    if (end_date) { where += ` AND r.created_at <= ?`; params.push(end_date + ' 23:59:59'); }

    const db = getDb();

    db.get(`SELECT COUNT(*) AS total FROM resources r ${where}`, params, (err, cnt) => {
        if (err) return res.status(500).json({ code: 1, message: '搜索失败', data: [] });

        const total = cnt.total;
        const dataParams = [...params, pageSize, offset];

        db.all(`
            SELECT r.id, r.title,
                CASE WHEN LENGTH(r.content) > 50
                    THEN SUBSTR(r.content, 1, 50) || '...'
                    ELSE r.content
                END AS content_summary,
                r.tags, r.created_at
            FROM resources r ${where}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, dataParams, (err2, rows) => {
            if (err2) return res.status(500).json({ code: 1, message: '搜索失败', data: [] });

            res.json({
                code: 0,
                data: rows.map(r => ({
                    id: r.id, title: r.title,
                    content_summary: r.content_summary || '',
                    tags: (r.tags || '').split(',').map(t => t.trim()).filter(Boolean)
                        .map((n, i) => ({ id: i + 1, name: n })),
                    created_at: r.created_at
                })),
                pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) }
            });
        });
    });
});

// ============================================================
// GET /api/search/timeline — 时间轴分段
// 返回按 今天/昨天/本周/本月/更早 分组的数据
// ============================================================
router.get('/timeline', (req, res) => {
    const db = getDb();

    db.all(`SELECT id, title, content, tags, created_at FROM resources ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ code: 1, message: '查询失败', data: [] });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart.getTime() - 86400000);
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(todayStart.getTime() - mondayOffset * 86400000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const groups = {
            today:     { label: '今天', items: [] },
            yesterday: { label: '昨天', items: [] },
            week:      { label: '本周', items: [] },
            month:     { label: '本月', items: [] },
            earlier:   { label: '更早', items: [] }
        };

        rows.forEach(row => {
            const d = new Date(row.created_at);
            const item = {
                id: row.id, title: row.title,
                content_summary: row.content ? (row.content.length > 50 ? row.content.slice(0,50)+'...' : row.content) : '',
                tags: (row.tags || '').split(',').map(t => t.trim()).filter(Boolean)
                    .map((n, i) => ({ id: i + 1, name: n })),
                created_at: row.created_at
            };
            if (d >= todayStart) groups.today.items.push(item);
            else if (d >= yesterdayStart) groups.yesterday.items.push(item);
            else if (d >= weekStart) groups.week.items.push(item);
            else if (d >= monthStart) groups.month.items.push(item);
            else groups.earlier.items.push(item);
        });

        const result = ['today','yesterday','week','month','earlier']
            .filter(k => groups[k].items.length)
            .map(k => ({ key: k, label: groups[k].label, count: groups[k].items.length, items: groups[k].items }));

        res.json({ code: 0, data: result });
    });
});

module.exports = router;
