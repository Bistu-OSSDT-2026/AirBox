const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { getDb } = require('../database/connection');

// TODO: 实现文件上传相关接口
// 例如：POST /api/upload - 上传文字/图片/文件

function jsonSuccess(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message: message,
        data: data
    });
}

function jsonError(res, message, statusCode = 400) {
    return res.status(statusCode).json({
        success: false,
        message: message,
        data: null
    });
}

function getResourceType(file) {
    if (!file) {
        return 'text';
    }

    if (file.mimetype && file.mimetype.startsWith('image/')) {
        return 'image';
    }

    return 'file';
}

function getResourceTitle(title, content, file) {
    if (title) {
        return title;
    }

    if (file && file.originalname) {
        return file.originalname;
    }

    if (content) {
        return content.slice(0, 20);
    }

    return '未命名资料';
}

router.get('/', (req, res) => {
    res.json({ status: 'TODO' });
});

router.post('/', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE'
                ? '上传失败，文件大小不能超过 10MB'
                : '上传失败，请检查文件后重试';
            return jsonError(res, message, 400);
        }

        const content = (req.body.content || '').trim();
        const tags = (req.body.tags || '').trim();
        const inputTitle = (req.body.title || '').trim();
        const file = req.file;

        if (!content && !file) {
            return jsonError(res, '请填写文字内容或选择文件', 400);
        }

        const type = getResourceType(file);
        const title = getResourceTitle(inputTitle, content, file);
        const fileUrl = file ? '/uploads/' + file.filename : null;
        const fileSize = file ? file.size : 0;

        const db = getDb();
        const sql = `
            INSERT INTO resources (title, type, content, file_url, tags, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [title, type, content, fileUrl, tags, fileSize], function (dbErr) {
            if (dbErr) {
                console.error('Failed to save uploaded resource:', dbErr.message);
                return jsonError(res, '上传失败，请稍后重试', 500);
            }

            return jsonSuccess(res, '上传成功', {
                id: this.lastID,
                title: title,
                type: type,
                content: content,
                file_url: fileUrl,
                tags: tags,
                file_size: fileSize
            }, 201);
        });
    });
});

module.exports = router;
