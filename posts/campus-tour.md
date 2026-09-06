---
title: "Cesium 第一人称巡览：让相机沿着校园道路平稳前进"
date: "2026-09-06"
series: campus
category: 三维可视化
tags: [Cesium, JavaScript, 动画]
cover: /images/campus-tour.webp
featured: true
excerpt: "地形采样、分段距离与相机姿态组成了巡览链路。一次计时基准混用，揭示了三维动画中比“每帧移动”更重要的细节。"
---

> 源码复盘：依据智慧校园 `index.html` 中的 `startPathTour`、`onTourTick` 和 `stopTour`。本文的时间与任务取消处理是改进建议，原项目未在本次博客改版中修改。

## 从路径折线走进第一人称

最短路径输出的是经纬度折线，第一人称巡览需要的是相机在每一时刻的位置和朝向。现有实现先用 `sampleTerrainMostDetailed` 采样路径顶点高度，再加上 2.5 米作为观察高度，随后计算相邻三维点之间的长度。

按各段累计长度，可以把“已经前进了多少米”映射到某一段上的插值比例。速度滑块控制每秒前进距离，相机沿线逐步更新。

## 两种时间不能直接相减

源码开始时设置：

```js
tourLastTime = performance.now() / 1000;
```

但在 tick 中使用：

```js
const now = Cesium.JulianDate.secondsDifference(
  clock.currentTime,
  clock.startTime,
);
let deltaTime = now - tourLastTime;
```

两者都是秒，却有不同的起点：一个相对于页面性能时间原点，一个相对于 Cesium 时钟的起始时间。第一次相减可能产生错误的正值或负值。源码只限制 `deltaTime > 0.5`，负值并没有被处理。

这说明问题不是单位，而是**时间参考系**。就像两个坐标都是米，也不代表可以直接放在一起计算。

## 选择一种计时基准

如果希望巡览按真实时间推进，可以始终使用 `performance.now()`，并在地形采样完成、准备启动监听时重置上一次时间。下面限制过大的帧间隔，以免浏览器切回前台后突然跳过很长一段路径。

```js
// 改进片段：初始化和更新使用同一个时钟
let lastTime = performance.now();
function tick() {
  const now = performance.now();
  const delta = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  tourCurrentDistance += tourSpeed * delta;
  // 根据累计距离查找路段，然后更新相机
}
```

这里的上限意味着页面卡顿或后台停留时不追赶全部真实时间，是一种交互取舍。若希望巡览跟随仿真时钟，就应始终使用 Cesium 时间，并处理暂停、倍速和时间回拨。

## 地形采样完成时，用户可能已经点了停止

现有代码在采样回调中检查 `tourActive`，这能拦住停止后的回调，但快速“开始、停止、再开始”仍有一个边界：第一次请求回来时，第二次巡览已把 `tourActive` 设成 `true`。

可以增加任务版本号，让每次开始和停止都改变版本。异步结果只在版本一致时生效。

```js
let tourVersion = 0;
async function prepareTour(provider, positions) {
  const version = ++tourVersion;
  const sampled = await Cesium.sampleTerrainMostDetailed(provider, positions);
  if (version !== tourVersion) return;
  // 校验高度有限，再启动本次巡览
}
function cancelPreparation() {
  tourVersion += 1;
}
```

实际接入还需在新巡览前移除旧监听，在失败时恢复按钮状态，并避免未捕获的 Promise 拒绝。任务版本号取消的是结果应用，不会中断已经发出的地形请求。

## 高度与平滑不能只看端点

只采样原始折线顶点，长路段中间可能仍跨过地形起伏。建议按路段距离加密采样，处理缺失高度，并跳过零长度段，避免插值时除以零。路径转角处还可以平滑朝向，减小突然转头的感觉。

验证至少包括平地直线、折角、陡坡、暂停恢复、快速重启、地形请求失败，以及后台标签页切回。动画稳定性取决于生命周期和数据边界，不只是视觉上的速度。

## 源码位置

- `Campus-GIS-Path-Optimization-main/index.html`：`startPathTour`、`onTourTick`、`stopTour`。
- [路径数据如何生成](/post/campus-path)。
