---
title: "筛选后选错景点：用稳定 ID 串起列表、地图与详情面板"
date: "2026-09-06"
series: wukong
category: 状态管理
tags: [Vue 3, OpenLayers, JavaScript]
cover: /images/wukong.webp
featured: true
excerpt: "数组下标描述的是位置，不是景点身份。一次筛选就能让三处界面失去同步，从这个问题重新梳理 WebGIS 的选中状态。"
---

> 源码复盘：依据悟空旅游 `MapView.vue`、`stores/locations.ts` 和 `components/openlayers/OLViewer.vue`。下文示例是改进方案，不声称已修复原项目。

## 两个数组里的第一个元素不是同一个地点

项目的列表来自 `filteredLocations`，点击行时把 `v-for` 的下标 `i` 传给 `selectLocation(i)`。而详情面板的 computed 从 `locStore.locations[selectedIdx]` 取数据。

假设原始数据是 `[云冈石窟, 悬空寺, 佛光寺]`，筛选后只剩 `[佛光寺]`。列表的第 0 项是佛光寺，但原始数组的第 0 项仍是云冈石窟。点击筛选结果就会打开另一个景点。

这不需要网络故障或地图坐标错误，只需要两个数组的顺序不同。

## 让状态保存身份，而不是位置

将 `selectedIdx` 改为 `selectedId`，列表点击、地图点击和详情查询都使用同一个稳定 ID。选中项可以来自完整数据集合，不再依赖列表的当前排序。

```js
// 建议：使用稳定 ID 表达选中状态
const selectedId = ref(null);
const selectedLocation = computed(
  () =>
    locStore.locations.find((location) => location.id === selectedId.value) ??
    null,
);
function selectLocation(id) {
  selectedId.value = id;
}
```

```html
<button
  v-for="location in filteredLocations"
  :key="location.id"
  :class="{ active: selectedId === location.id }"
  @click="selectLocation(location.id)"
>
  {{ location.name }}
</button>
```

`key` 和选中状态都用 ID，但它们解决不同问题：`key` 帮助 Vue 复用正确的 DOM；`selectedId` 表达业务层的当前地点。

## 列表和地图应共享哪份数据

现有页面给地图传完整的 `locStore.locations`，列表却可以使用本地筛选结果。需要先决定产品语义：筛选仅缩小列表，还是同时缩小地图上的点？

如果两者都过滤，就把同一个 computed 结果传给地图。如果地图保留全部地点，界面应明确区分“当前筛选”和“当前选中”，并考虑选中地点不在列表中时如何反馈。

当服务端重新拉取数据、当前 ID 不再存在时，建议显式清空选中项与详情面板。不要让旧数组下标自动指向一个新地点。

## 标记高亮也需要完整更新

OpenLayers 的 `flyTo` 在现有实现中只给新选中点应用高亮样式，没有恢复旧点。连续选择后，可能有多个点保留选中样式。

更新样式时，应遍历标记，依据 ID 判断是否为当前选中项；清空选中状态也走同一条更新路径。

```js
// 方案片段：每次选择都同时更新选中和未选中两类样式
function updateSelection(selectedId) {
  // 原组件把 OpenLayers Map 导入为 Map，显式使用原生映射避免重名
  const locationsById = new globalThis.Map(
    props.locations.map((item) => [item.id, item]),
  );
  markerLayer
    .getSource()
    .getFeatures()
    .forEach((feature) => {
      const id = feature.get("locationId");
      const location = locationsById.get(id);
      if (location)
        feature.setStyle(getMarkerStyle(location, id === selectedId));
    });
}
```

收藏状态也有相似问题：store 保存的是 `favorites` ID 数组，而标记样式读取 `loc.isFavorited`。需要在传给地图前做派生映射，或者直接把收藏 ID 集合传入渲染层，避免出现两份不一致的来源。

## 一组低成本的回归检查

先选一个景点，再进行关键词筛选、切换城市、倒序排序，确认列表高亮、地图位置与详情标题始终对应同一个 ID。随后取消筛选、清空选中、收藏当前点，检查旧样式是否恢复。

将对象身份从显示位置中分离后，分页、地图聚合、搜索和服务端刷新都更容易处理。这是地图联动问题，也是普通数据列表中的通用规则。

## 源码位置

- `wukong-travel/client/src/views/MapView.vue`：`selectedIdx`、`filteredLocations` 和 `selectedLocation`。
- `wukong-travel/client/src/components/openlayers/OLViewer.vue`：`flyTo` 与 `getMarkerStyle`。
- `wukong-travel/client/src/stores/locations.ts`：收藏 ID 状态。
