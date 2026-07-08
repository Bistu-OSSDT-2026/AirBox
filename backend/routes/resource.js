/**
 * C板块 - 资料展示模块
 * 负责：资料列表展示、查看详情
 * 不要实现：修改、删除、收藏、搜索、上传
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// ========== 数据库配置 ==========
const { getDb } = require('../database/connection');

const db = getDb();

// ============================================================
// 接口1：获取所有资料列表
// 请求方式：GET
// 请求路径：/api/resources
// 返回：所有资料列表（按时间倒序）
// ============================================================
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            id, 
            title, 
            type, 
            content, 
            file_url, 
            tags, 
            created_at 
        FROM resources 
        ORDER BY created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('查询资料失败:', err.message);
            return res.status(500).json({
                code: -1,
                message: '服务器错误：' + err.message
            });
        }

        res.json({
            code: 0,
            data: rows,
            message: 'success'
        });
    });
});

// ============================================================
// 接口2：查看单条资料详情
// 请求方式：GET
// 请求路径：/api/resources/:id
// 参数：id（URL路径参数）
// 返回：该条资料的完整信息
// ============================================================
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT 
            id, 
            title, 
            type, 
            content, 
            file_url, 
            tags, 
            created_at 
        FROM resources 
        WHERE id = ?
    `;

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('查询资料详情失败:', err.message);
            return res.status(500).json({
                code: -1,
                message: '服务器错误：' + err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                code: -1,
                message: '资料不存在'
            });
        }

        res.json({
            code: 0,
            data: row,
            message: 'success'
        });
    });
});

module.exports = router;