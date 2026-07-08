const express = require('express');
const path = require('path');

// 初始化路由

const uploadRouter = require('./backend/routes/upload');
const resourceRouter = require('./backend/routes/resource');
const searchRouter = require('./backend/routes/search');
const manageRouter = require('./backend/routes/manage');

// 初始化数据库
const { getDb } = require('./backend/database/connection');
getDb();

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 前端页面
app.use('/mobile', express.static(path.join(__dirname, 'frontend/mobile')));
app.use('/desktop', express.static(path.join(__dirname, 'frontend/desktop')));

// 静态文件服务 - 上传文件
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// API 路由
app.use('/api/resources', resourceRoutes);
app.use('/api/upload', uploadRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/search', searchRouter);
app.use('/api/manage', manageRouter);

// 首页 - 显示服务状态
app.get('/', (req, res) => {
    res.send('AirBox Server Running');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`AirBox server is running on http://localhost:${PORT}`);
});
