---
title: "JavaScript 基础：数组、对象与一份景点数据"
date: "2026-09-06"
series: basics
category: JavaScript 入门
tags: [JavaScript, 基础学习]
cover: /images/basics-javascript-data.webp
excerpt: "从景点列表理解对象、引用、map、filter 和 find，先把数据处理清楚，再把它交给页面与地图。"
---

## 用对象描述一个地点

对象适合把有关联的数据放在一起。比如一个地点有稳定的编号、名称和经纬度，字段名称表达数据的含义。

```js
const place = { id: 1, name: "示例景点", lng: 112.5, lat: 37.8 };
console.log(place.name);
```

这里的坐标仅用于代码演示，不表示真实景点位置。`const` 限制的是变量重新赋值，并不禁止修改对象里的字段。`place.name = '新名称'` 仍然有效。

## 数组负责组织多个对象

```js
const places = [
  { id: 1, name: "示例甲", city: "太原", lng: 112.5, lat: 37.8 },
  { id: 2, name: "示例乙", city: "大同", lng: 113.3, lat: 40.1 },
];
const names = places.map((place) => place.name);
const selectedCity = places.filter((place) => place.city === "太原");
const current = places.find((place) => place.id === 2);
```

`map` 把每一项变成新的表达，结果数量不变；`filter` 留下符合条件的项；`find` 返回第一个符合条件的对象，没有找到时返回 `undefined`。它们不会直接修改原数组，但返回的对象可能仍与原数组共享引用。

## 赋值不等于复制对象

```js
const selected = places[0];
selected.name = "更新后的名字";
console.log(places[0].name); // 原数组里的对象也变了

const copy = { ...places[0] };
copy.name = "另一份名字"; // 不影响原对象的这个字符串字段
```

展开语法是浅复制。如果对象里还有 `properties: { rating: 5 }`，复制后的 `properties` 仍指向同一个嵌套对象。对于普通可克隆数据，可以考虑 `structuredClone`；地图引擎实例、函数和 DOM 元素不适合当成普通数据深复制。

## 先处理空值，再展示内容

```js
const selected = places.find((place) => place.id === 999);
const title = selected?.name ?? "未选择地点";
```

可选链 `?.` 避免在空值上继续访问属性。空值合并 `??` 只处理 `null` 和 `undefined`，不会把有效的 `0` 或空字符串误当作缺失。地图缩放级别、距离和计数常常可能等于零，这时区别很重要。

## 一个小练习

给每个地点添加 `visited` 字段，筛选尚未访问的地点，再用 `map` 提取名称。随后修改筛选结果里的一个对象，观察原数组是否变化。这个练习能帮助理解“新数组”和“全新的对象”并不是同一回事。

延伸阅读：[为什么地图联动要使用稳定 ID](/post/wukong-selection)。
