---
title: "点击分析却没有缓冲区？追踪一次被提前清空的 Vue 状态"
date: "2026-09-06"
series: wukong
category: 问题复盘
tags: [Vue 3, Turf.js, 空间分析]
cover: /images/wukong-buffer.webp
featured: true
excerpt: "问题不在空间算法，而在清理函数：计算前的一次 clearBuffer 把中心点也清掉了。拆开输入状态与结果状态，让地图反馈重新变得可靠。"
---

> 源码复盘：黑神话山西取景地旅游平台。依据 `client/src/views/MapView.vue` 与 `client/src/utils/spatial.ts`。截图来自项目 visual 目录，可能早于当前源码；下面给出可复现的逻辑原因和建议修正。

## 表面上是地图不显示

用户选一个取景地，调整半径，点击缓冲区分析，希望看到附近的地点和地图上的范围。项目的 `drawBuffer()` 先检查中心点是否存在，再调用 Turf.js 筛选范围内的地点。

但在这两步之间，源码调用了 `clearBuffer()`。这个函数除了清空结果，还将 `bufferCenterId` 设为 `null`。

```js
// 现有调用顺序的缩略版
function drawBuffer() {
  if (bufferCenterId.value === null) return;
  clearBuffer();
  const center = locStore.locations.find((l) => l.id === bufferCenterId.value);
  if (!center) return;
}
function clearBuffer() {
  bufferPOIs.value = [];
  bufferCenterId.value = null;
}
```

第二次查找中心点时，条件已经变成 `id === null`，因此函数提前返回。算法尚未执行，地图自然没有新结果。

## 输入状态与结果状态要分开

“重算”和“重置”是不同命令。重算需要保留中心与半径，只替换结果；重置才需要清空全部条件。可以分别命名 `clearBufferResult` 与 `resetBuffer`，减少调用方对隐藏副作用的误判。

```js
// 建议结构：结果保存本次分析的几何与命中列表
const bufferResult = ref(null);
function drawBuffer() {
  const center = locStore.locations.find((l) => l.id === bufferCenterId.value);
  if (!center) return;
  const radius = bufferRadius.value;
  const candidates = locStore.locations.filter((l) => l.id !== center.id);
  bufferResult.value = {
    geometry: createBuffer(center.lng, center.lat, radius).geometry,
    points: findPointsInBuffer(center.lng, center.lat, radius, candidates),
    centerId: center.id,
    radius,
  };
}
function resetBuffer() {
  bufferResult.value = null;
  bufferCenterId.value = null;
}
```

这个方案需要同步让地图、列表和结果摘要读取 `bufferResult`，不是仅替换一段函数即可完成的补丁。

## 没有命中地点，不等于没有缓冲区

另一个判断藏在 `bufferGeometry` 的 computed 中：当 `bufferPOIs.length === 0` 时，直接返回 `null`。可是某个地点周围 1 公里没有其他景点，正是一个合法的分析结果。

几何是否存在，应由是否执行过有效分析决定；命中列表为空，只决定结果列表如何呈现。让这两个事实独立，用户才会知道“范围内没有其他取景地”，而不是怀疑按钮无效。

## 保持一次分析的结果一致

如果几何实时读取半径滑块，而命中地点只在点击时更新，拖动滑块后会出现“新半径的圆 + 旧半径的列表”。有两种一致的交互方式：每次输入变化都重算两者，或者把本次分析的半径、几何、结果作为一个快照保存。

上面的 `bufferResult` 采用快照方案。改动参数后可将结果标为待更新，再点击分析。不要让屏幕上的圆和列表默默表达两次不同的计算。

## 验证这一类状态问题

| 操作             | 正确反馈                         |
| ---------------- | -------------------------------- |
| 未选中心直接分析 | 提示选择中心                     |
| 选中心后分析     | 中心保持不变，生成范围           |
| 范围内无其他景点 | 范围仍显示，列表显示 0 个结果    |
| 更改半径         | 几何与结果列表保持同一次分析口径 |
| 重置后再次分析   | 重新选择中心，不复用旧结果       |

遇到“地图不渲染”时，先沿着事件、输入、结果、组件属性逐步追踪。越早确认数据有没有产生，越少在渲染引擎里无效排查。

## 源码位置

- `wukong-travel/client/src/views/MapView.vue`：`drawBuffer`、`clearBuffer`、`bufferGeometry`。
- `wukong-travel/client/src/utils/spatial.ts`：`createBuffer`、`findPointsInBuffer`。
- [项目仓库](https://github.com/2178722445/WuKong-Travel-)。
