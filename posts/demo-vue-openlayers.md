---
title: "Vue 3 + OpenLayers 地图项目入门"
date: "2026-09-01"
tags: "Vue 3,OpenLayers,WebGIS"
excerpt: "从 Vue 的挂载与卸载开始，让 OpenLayers 地图拥有清晰的容器、坐标转换与生命周期。"
cover: /images/wukong.webp
category: 开发入门
---

## 前言

地图引擎负责渲染，Vue 负责页面与交互状态。让两者在明确的生命周期边界协作，可以避免路由切换后的重复实例和遗留监听。

## 示例代码

```js
import { ref, onMounted, onBeforeUnmount } from "vue";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import { fromLonLat } from "ol/proj.js";
import "ol/ol.css";

const container = ref(null);
let map;
onMounted(() => {
  map = new Map({
    target: container.value,
    layers: [new TileLayer({ source: new OSM() })],
    view: new View({ center: fromLonLat([112, 37]), zoom: 7 }),
  });
});
onBeforeUnmount(() => {
  map?.setTarget(undefined);
  map?.dispose();
});
```

模板中需提供 `ref="container"` 的容器，并赋予实际高度。示例需安装 `ol`，是独立地图组件的起点，并非博客运行所需依赖。

## 三个容易漏掉的细节

- 只有组件挂载后，容器元素才可以交给地图实例。
- 默认视图使用 Web Mercator，经纬度应通过 `fromLonLat` 转换。
- 退出页面时清理地图实例和自定义事件，保留底图提供方的署名。

## 接下来尝试什么

在图层中加入取景地点，使用稳定 ID 关联列表和标记，再逐步加入筛选、定位与空间分析。先保证数据流清晰，再扩展交互。

> 地图能显示是第一步。反复进入与离开页面、改变容器大小、切换数据，都应保持行为一致。
