# HERMIT · 地图之外

Vue 3 Composition API、Vite、Vue Router、Element Plus 和纯 CSS 构建的个人技术博客。

## 1. 项目结构

```text
personblog/
├── posts/                       # Markdown 文章与 YAML 元数据
├── public/images/               # 已优化的头像和真实项目截图
├── scripts/
│   ├── check-content.mjs         # 文章解析、专题与链接检查
│   └── prepare-images.mjs        # 从本地原始项目生成 WebP
├── src/
│   ├── App.vue                  # 顶部导航、图标侧栏、进度条、页脚
│   ├── components/
│   │   ├── MarkdownContent.vue  # 代码复制与图片查看
│   │   ├── PostCard.vue         # 网格 / 列表文章项
│   │   ├── ProjectCard.vue      # 项目专题
│   │   ├── ProfileSidebar.vue   # 个人资料、统计与专题入口
│   │   └── SkillStack.vue       # 五级技术自评
│   ├── composables/useReveal.js # 视口进入动画
│   ├── data/profile.js          # 个人信息、邮箱、项目链接
│   ├── pages/                   # Home、Blog、Post、About、Write
│   ├── router/index.js          # 懒加载路由与滚动恢复
│   ├── styles/global.css       # 设计变量、模块样式、响应式
│   └── utils/
│       ├── posts.js             # import.meta.glob + YAML 解析
│       └── markdown.js          # marked + 高亮 + HTML 清理
└── vite.config.js
```

## 2. 核心组件

完整实现直接位于 `src/App.vue` 与 `src/pages/`。项目与文章卡片复用组件，个人资料不重复硬编码；技术自评保留在 `SkillStack.vue` 内，方便修改。

首页包括开放式身份介绍、双项目专题、精选笔记、个人侧栏、技术自评与专题索引。列表页支持全文关键词、项目、标签、日期排序和网格 / 列表切换，筛选条件保存在 URL。文章页提供语法高亮、复制代码、图片放大、章节目录、复制链接及上一篇 / 下一篇。不存在的路由和文章有独立空状态。

## 3. 路由

`src/router/index.js` 懒加载 `/`、`/blog`、`/post/:slug`、`/about`。支持页面锚点、回退滚动恢复和未知地址。部署到静态服务时将未知路径回退到 `index.html`，以支持直接刷新文章链接。

## 4. 新增 Markdown 文章

在 `posts/` 添加文件，文件名就是文章 slug。日期使用整理 / 发布日期，不表示原项目开发时间。

```markdown
---
title: "一篇新的技术笔记"
date: "2026-09-06"
series: campus
category: 空间分析
tags: [Python, Cesium]
cover: /images/campus.webp
featured: true
excerpt: "介绍问题、思路和适用范围。"
---

## 问题背景

正文内容。
```

`series` 可使用 `basics`、`campus`、`wukong` 或 `notes`。需要增加新的项目系列时同步维护 `profile.js`。元数据支持 YAML 数组和旧版逗号分隔标签；兼容 Windows CRLF 与 UTF-8 BOM。代码高亮注册了 JavaScript、TypeScript、Python、JSON、Bash、HTML/XML、CSS，未知语言按纯文本展示。

### 站内写作

文章列表右上角或桌面侧栏的「写博客」进入 `/write`。支持 Markdown 实时预览、工具栏、撤销重做、多份草稿自动保存、导入及导出。草稿保存在当前浏览器、当前站点地址的 localStorage 中，不跨设备同步；清理浏览器数据前请先导出。

运行 `npm run dev` 并通过 localhost 或 127.0.0.1 访问时，「发布文章」会将新文件写入 `posts/` 并打开详情页。同名地址拒绝覆盖，请修改文章地址。已发布文件可直接在编辑器中修改。本地接口仅接受本机同源请求，不是公开后台，也不自动部署到互联网。

静态构建和 `npm run preview` 不提供写文件接口，仍支持草稿和导出；将导出的 Markdown 放入 `posts/` 后重新构建部署即可更新线上内容。共享序列化逻辑位于 `src/utils/editor.js`，本地接口位于 `server/editor-plugin.js`。

基础学习系列新增六篇：JavaScript 数据处理、异步请求、Vue 响应式、Vue 生命周期、GeoJSON 与坐标系、Python JSON 处理。与原有九篇一起共十五篇文章。

## 5. 启动与验证

使用 Node.js 20.19+ 或 22.12+ 的维护版本（当前环境为 Node.js 24）：

```bash
npm install
npm run dev -- --host 127.0.0.1
npm test
npm run build
```

默认访问 `http://127.0.0.1:5173/`。若被占用，Vite 会打印新端口。生产文件生成到 `dist/`，可用 `npm run preview` 验证。

`public/images/` 已包含压缩后的图片，正常运行不需要相邻项目文件夹。只有重新生成图片时才运行 `npm run images`，该脚本会读取本机同级项目目录以及原始头像，输出独立 WebP 副本，不修改原文件。

## 参考设计与内容依据

详见 `docs/design-and-content.md`。这次改版新增 8 篇源码复盘，保留并完善 1 篇 Vue/OpenLayers 入门文章。原项目中的建议修正没有在本次改版中自动应用。
