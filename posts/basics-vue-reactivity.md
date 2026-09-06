---
title: "Vue 3 入门：ref、reactive、computed 与 watch 怎么选"
date: "2026-09-06"
series: basics
category: Vue 入门
tags: [Vue 3, JavaScript, 基础学习]
cover: /images/basics-vue-reactivity.webp
excerpt: "用一个可筛选的地点列表理解响应式数据、派生结果与副作用，让组件中的状态各司其职。"
---

## ref 保存会变化的值

```js
import { ref, computed, watch } from "vue";

const keyword = ref("");
const places = ref([
  { id: 1, name: "示例甲" },
  { id: 2, name: "示例乙" },
]);
```

在 JavaScript 中通过 `.value` 读取与修改 ref。模板对顶层 ref 自动解包，因此可以直接写 `v-model="keyword"`。ref 不只适用于字符串，也可以保存数组和对象。

## reactive 适合成组的对象状态

```js
import { reactive } from "vue";
const filters = reactive({ keyword: "", city: "" });
filters.city = "太原";
```

reactive 返回对象的响应式代理。直接解构基本类型属性，比如 `const { city } = filters`，得到的是当时的字符串，不再跟随原属性变化。需要保持联系时可用 `toRefs(filters)`，或者始终读取 `filters.city`。

地图引擎实例不必深度代理。对于 Cesium Viewer 这类复杂对象，`shallowRef` 通常更合适：只追踪实例引用的替换，不遍历内部状态。

## computed 表达由数据推导的数据

```js
const visiblePlaces = computed(() => {
  const query = keyword.value.trim();
  return places.value.filter((place) => place.name.includes(query));
});
```

computed 会追踪读取到的响应式依赖，并缓存结果。筛选列表、计数和当前选中对象都适合放在这里。计算函数应保持纯粹，不要在里面发送请求、修改源数组或触发提示消息。

例如 `places.value.sort(...)` 会修改原数组；若只是需要排序后的展示，应使用 `[...places.value].sort(...)`，避免计算过程中改变数据源。

## watch 处理数据变化之后的动作

```js
const selectedId = ref(null);
watch(selectedId, (id) => {
  if (id !== null) {
    // 调用地图定位方法属于副作用
    console.log("需要定位的地点 ID:", id);
  }
});
```

watch 适合请求数据、保存草稿、更新地图等副作用。默认不会立即执行回调，若初始化也要执行可使用 `{ immediate: true }`。监控对象某个字段时写 `watch(() => filters.city, ...)`，传入获取字段值的函数。

深度监听并不是越多越好。地图图层或大型数据集合频繁变化时，应尽量监听明确的字段，避免为了简单方便而持续遍历整个对象。

## 用一句问题判断选择

“这是什么状态”对应 ref 或 reactive；“它由什么推导而来”对应 computed；“它变化后要做什么”对应 watch。将这三类职责分清，组件中的逻辑就更容易检查与复用。

练习：为上面的列表加一个选中 ID，再用 computed 查找当前对象。不要把数组下标当成地点身份。
