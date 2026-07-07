# AirBox

## 项目简介

AirBox 是一个面向个人用户的跨设备资料收集与整理工具。

用户可以通过手机浏览器快速上传文字、图片和文件，所有资料都会同步到电脑端进行展示，并按照时间、类型和标签进行整理，帮助用户解决微信文件传输助手和聊天记录中资料零散、难查找的问题。

## 技术栈

- **前端**：HTML + CSS + JavaScript（原生）
- **后端**：Node.js + Express
- **数据库**：SQLite
- **文件上传**：Multer

## 如何启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务器
npm start

# 3. 访问地址
# 首页：       http://localhost:3000
# 手机端：     http://localhost:3000/mobile
# 电脑端：     http://localhost:3000/desktop
```

## 项目目录说明

```
AirBox/
│
├── app.js                  # 应用入口文件，启动 Express 服务器
├── package.json            # 项目依赖和脚本配置
├── .gitignore              # Git 忽略文件配置
├── README.md               # 项目说明文档
│
├── frontend/               # 前端页面
│   ├── mobile/             # 手机端页面（上传入口）
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   └── desktop/            # 电脑端页面（资料展示与管理）
│       ├── index.html
│       ├── style.css
│       └── script.js
│
├── backend/                # 后端代码
│   ├── routes/             # API 路由
│   │   ├── upload.js       # 文件上传相关接口
│   │   ├── resource.js     # 资源管理相关接口
│   │   ├── search.js       # 搜索相关接口
│   │   └── manage.js       # 资源管理/编辑/删除接口
│   ├── controllers/        # 业务逻辑处理层
│   ├── models/             # 数据模型
│   ├── middleware/          # 中间件
│   │   └── upload.js       # Multer 文件上传中间件配置
│   ├── uploads/            # 上传文件存储目录
│   └── database/           # 数据库相关
│       └── connection.js   # SQLite 数据库连接配置
│
└── docs/                   # 项目文档
```

## 各目录职责

| 目录 | 说明 |
|------|------|
| `frontend/mobile/` | 手机端页面，负责文件上传的用户界面 |
| `frontend/desktop/` | 电脑端页面，负责资料展示与管理的用户界面 |
| `backend/routes/` | API 路由层，各路由文件对应不同功能模块，方便多人并行开发 |
| `backend/controllers/` | 控制层，放置具体的业务逻辑 |
| `backend/models/` | 模型层，定义数据结构 |
| `backend/middleware/` | 中间件，如文件上传、请求校验等 |
| `backend/uploads/` | 用户上传文件的存储目录 |
| `backend/database/` | 数据库连接与初始化 |
| `docs/` | 项目文档，如 API 文档、设计稿等 |

## 后续开发

各路由文件目前已预留好接口位置，返回 `TODO` 标记。5 名成员可以分别在不同的路由文件中开发各自的功能模块，互不影响。
