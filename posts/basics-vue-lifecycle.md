---
title: "地图组件的生命周期：挂载、更新与清理"
date: "2026-09-06"
series: basics
category: Vue 入门
tags: [Vue 3, OpenLayers, 基础学习]
cover: /images/basics-vue-lifecycle.webp
excerpt: "地图能显示只是开始。理解 DOM 挂载时机、容器尺寸变化和资源回收，避免路由切换后遗留实例。"
---

## 为什么不能在 setup 里立即读取容器

`script setup` 执行时，模板对应的 DOM 还没有挂载。模板引用通常还是 `null`，地图引擎还没有可以绘制的目标元素。

使用 `onMounted` 初始化依赖 DOM 的资源，并给容器明确高度。宽度存在但高度为零，是地图初始化成功却看不到画面的常见原因。

## 一个包含清理逻辑的最小组件

下面是独立组件示例，需要安装 `ol`。博客只是展示代码，本身不运行地图引擎。

```html
<template><div ref="container" class="map"></div></template>
```

```js
import { ref, onMounted, onBeforeUnmount } from "vue";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import "ol/ol.css";

const container = ref(null);
let map;
let observer;
onMounted(() => {
  map = new Map({
    target: container.value,
    layers: [new TileLayer({ source: new OSM() })],
    view: new View({ center: [0, 0], zoom: 2 }),
  });
  observer = new ResizeObserver(() => map.updateSize());
  observer.observe(container.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  map?.setTarget(undefined);
  map?.dispose();
});
```

```css
.map {
  width: 100%;
  height: 420px;
}
```

ResizeObserver 能捕获侧栏折叠等导致的容器变化，不局限于浏览器窗口 resize。组件卸载时将观察器和地图一起回收，避免继续访问旧 DOM。

## 更新数据通常不需要重建地图

地图实例和地图数据有不同生命周期。搜索条件变化后，通常只需更新矢量图层的 source；每次筛选都重建整个地图，会丢失视角并重复初始化资源。

同样，选中 ID 变化只应更新选中样式或相机位置，不必重建底图。把实例初始化和业务数据同步分开，逻辑会更稳定。

## nextTick 与 KeepAlive

修改 Vue 状态后立即读 DOM 尺寸，可能读到旧布局。`await nextTick()` 等待 Vue 完成本轮 DOM 更新，但它不会等待网络、图片加载或 CSS 过渡结束。

如果组件被 KeepAlive 缓存，切走时不会普通卸载。需要根据业务使用 `onActivated` 和 `onDeactivated`，恢复尺寸或暂停动画。不要只添加卸载清理，却忽略缓存后的隐藏状态。

## 验证清单

重复进入和离开地图页面，确认只存在一个当前实例；折叠侧栏后地图仍填满容器；网络失败后仍能重试；退出页面后没有继续触发的定时器和自定义监听。

继续阅读：[Vue 响应式工具的职责划分](/post/basics-vue-reactivity)。
