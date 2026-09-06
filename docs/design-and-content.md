# 设计与内容说明

## 参考站观察

2026-09-06 实际访问并读取 `https://www.negiao.cn/index.html`：

- 固定左侧图标导航，有悬停提示；主内容按个人介绍、贡献日历、项目、研究与联系方式分区。
- 桌面端项目使用多列网格；标题与简介层次明确，按钮和标签承担快捷入口。
- CSS 使用无衬线正文、等宽辅助信息，标题粗体。参考站标题采用响应式缩放；本实现采用固定字号与断点切换。
- 参考站卡片包含玻璃背景、边框、阴影和不同尺寸圆角；本实现使用 8px 以内的文章 / 项目卡片与开放式页面分区。
- 参考站定义平滑滚动、按钮和卡片悬停过渡、导航下划线、侧栏提示以及返回顶部。本实现保留这些交互思路，增加按视口显现与页面淡入。

本博客没有复制参考站的霓虹渐变、贡献数据或个人资料。采用纸白 `#F7F9F8`、墨绿 `#346557`、雾蓝 `#66859C`、珊瑚色 `#CB785E`，保留原需求浅绿 `#D3F2DE` 作为辅助色。字号、阴影与色彩集中在全局 CSS 中。

桌面保留「固定图标导航 + 顶栏 + 主内容 / 个人侧栏」；平板把侧栏移到下方两列；手机保留顶栏导航并将项目卡片改为单列。减弱动态效果设置下，显现、切换和滚动动画均停用。

## 原项目识别

相邻 `智慧城市/vuedemo` 目前是 Vue CLI 默认脚手架，没有足够三维业务内容。因此按项目说明、算法文件与三维截图，将用户提及的智慧三维项目识别为 `Campus-GIS-Path-Optimization-main` 中的智慧校园 GIS 系统。

悟空旅游取自 `wukong-travel`。其 `README.md`、截图和现有源码并非所有功能都一一对应，文章以所读源码为依据，截图仅作为原项目已有视觉记录。没有声称运行过原项目或验证过真实路由服务。

## 文章与证据

| 文章              | 源文件                                           | 主要问题 / 实现                                            |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| campus-path       | scripts/dijkstra_path_analysis.py                | 顶点建图、最近节点、同节点 LineString 退化                 |
| campus-isochrone  | scripts/isochrone_analysis.py                    | 秒制权重、三次 Dijkstra、凸包共线退化与近似                |
| campus-blind      | scripts/blind_spot_analysis.py                   | Polygon 在局部导入前使用、丢失内环、平方度面积             |
| campus-tour       | index.html                                       | performance.now 与 Cesium 相对时间混用、采样任务重启竞态   |
| wukong-buffer     | MapView.vue / utils/spatial.ts                   | clearBuffer 重置中心、空结果隐藏有效几何、滑块与结果不同步 |
| wukong-selection  | MapView.vue / OLViewer.vue / stores/locations.ts | 筛选数组下标错误、旧选中样式与收藏派生状态                 |
| wukong-projection | spatial.ts / spatial_service.py                  | Turf 圆与 Web Mercator 平面 buffer 的距离口径              |
| wukong-routing    | spatial.ts / spatial_service.py                  | 最近邻串点、完全图最短路与真实道路规划的差异               |

每篇文章标明源码事实与建议方案。发布日是本次整理日期，未虚构项目开发历史、实测性能或已落地修复。没有发布源代码中的访问令牌或环境凭据。

## 维护位置

- 头像 / 邮箱 / GitHub：`src/data/profile.js`。
- 技术水平：`src/components/SkillStack.vue`，五格对应最初给定的星级。
- 文章：`posts/*.md`。
- 视觉资产：`public/images/`，通过 sharp 生成 WebP。
- 内容与链接检查：`npm test`。
