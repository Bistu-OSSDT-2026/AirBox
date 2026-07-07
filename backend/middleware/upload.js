const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

function ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

ensureUploadDir();

// 设置文件存储位置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        ensureUploadDir();
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // 使用时间戳 + 原文件名避免冲突
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// 文件过滤（TODO: 根据实际需求调整允许的文件类型）
const fileFilter = (req, file, cb) => {
    // 暂时允许所有文件类型
    cb(null, true);
};

// 创建 multer 实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    },
    fileFilter: fileFilter
});

module.exports = upload;
