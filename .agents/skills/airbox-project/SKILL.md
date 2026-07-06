---
name: airbox-project
description: AirBox 项目的全局开发规范。参与 AirBox 项目的任何开发、修改、调试、重构或 Bug 修复时，都应遵循本 Skill。
---

# AirBox Project Skill

## 项目简介

AirBox 是一个面向个人用户的 Web 跨设备资料收集与整理工具。

用户可以通过手机浏览器快速上传文字、图片和文件，所有资料统一保存到系统中，并在电脑端按照时间、类型和标签进行浏览和整理。

项目目标是帮助用户解决微信文件传输助手、聊天记录、相册等资料零散、难查找的问题。

这是一个课程开源项目，由 5 名成员协作开发，采用 AI 辅助开发模式。

---

# 项目目标

本项目采用 MVP（Minimum Viable Product，最小可运行版本）开发原则。

优先保证：

1. 功能正确
2. 项目稳定
3. 代码简单易懂

不要为了"高级"而增加不必要的复杂设计。

---

# 技术栈

前端：

- HTML
- CSS
- JavaScript（原生）

后端：

- Node.js
- Express

数据库：

- SQLite（sqlite3）

文件上传：

- Multer

版本管理：

- Git + GitHub

除非用户明确要求，否则不要引入 React、Vue、TypeScript、JWT、权限系统等额外框架。

---

# 项目目录

```
AirBox/
│
├── frontend/
│   ├── mobile/
│   └── desktop/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── uploads/
│   └── database/
│
├── docs/
│
├── app.js
├── package.json
└── README.md
```

生成代码时，应尽量遵循现有目录结构，不随意新增目录。

---

# Resource 数据结构

所有资料统一使用 Resource 数据结构。

包含字段：

- id
- title
- type
- content
- file_url
- tags
- file_size
- created_at
- updated_at

新增功能时，应优先复用该数据结构，不要重新设计另一套资源模型。

---

# API 规范

所有接口统一使用 `/api` 前缀。

目前接口包括：

POST /api/upload

GET /api/resources

GET /api/resources/:id

GET /api/search

PUT /api/manage/:id

DELETE /api/manage/:id

遵循 RESTful 风格。

不要修改已有接口名称。

新增接口时，应保持统一命名风格。

---

# Git 协作规范

项目采用多人协作开发。

每位成员负责一个完整功能模块。

开发流程：

1. 从 main 创建自己的功能分支

例如：

feature/upload

feature/display

feature/search

feature/manage

2. 在自己的功能分支开发

3. 完成后提交 Pull Request

4. 合并到 main

不要直接在 main 分支开发。

---

# Coding Style

保持项目已有代码风格。

遵循以下原则：

- 命名统一
- 代码简洁
- 不过度封装
- 不重复实现已有功能
- 优先复用已有代码
- 必要时添加简洁注释

如果项目已有写法，应保持一致，而不是全部重写。

---

# AI Development Rules

协助开发时，请遵循以下原则：

1. 修改代码前，先阅读相关文件。

2. 只修改当前任务涉及的文件。

3. 不修改无关模块。

4. 不随意重构整个项目。

5. 不删除已有代码，除非用户明确要求。

6. 优先扩展已有模块，而不是重新创建。

7. 保持 API、目录结构和数据结构一致。

8. 保持项目整体风格统一。

9. 如果需求不明确，应主动询问，而不是自行决定项目架构。

---

# AI Safety Rules

开发过程中：

- 不新增未经允许的第三方依赖。
- 不改变项目技术栈。
- 不修改 package.json，除非当前任务明确需要。
- 不修改其他成员负责的功能模块。
- 不随意移动、删除或重命名文件。
- 不覆盖已有实现。
- 不生成与当前任务无关的大规模修改。

始终采用最小修改原则（Minimal Changes）。

---

# 团队协作原则

这是一个多人协作项目。

默认认为：

- 多位成员可能同时开发不同模块。
- 修改代码时，应尽量减少对其他模块的影响。
- 保持公共接口稳定。
- 保持代码风格统一。
- 保持目录结构统一。

如果发现已有实现可以复用，应优先复用，而不是重新实现。

---

# 回复要求

协助开发时：

1. 先说明本次准备修改哪些文件。

2. 再生成代码。

3. 修改完成后，简要说明改动内容。

4. 不输出与当前任务无关的代码。

始终优先保证项目一致性，而不是一次性生成大量代码。