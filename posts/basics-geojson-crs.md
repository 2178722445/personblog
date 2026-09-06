---
title: "GeoJSON 与坐标系入门：经纬度为什么不能直接当米用"
date: "2026-09-06"
series: basics
category: GIS 基础
tags: [GeoJSON, 坐标系, 基础学习]
cover: /images/basics-geojson-crs.webp
excerpt: "认识 Feature、Geometry 和经纬度顺序，再理解 EPSG:4326 与 EPSG:3857 在存储、显示和计算中的不同角色。"
---

## 先读懂一条 GeoJSON

```json
{
  "type": "Feature",
  "properties": { "id": 1, "name": "示例地点" },
  "geometry": {
    "type": "Point",
    "coordinates": [112.5, 37.8]
  }
}
```

`geometry` 描述形状，`properties` 保存名称和编号等属性。FeatureCollection 使用 `features` 数组组织多个 Feature。数据编号应保持稳定，不要依赖地图上当前显示的顺序。

按照 RFC 7946，GeoJSON 的地理坐标使用 WGS84，经度在前、纬度在后。这与日常口语的“纬度、经度”顺序容易混淆。示例坐标仅用于说明数据结构。

## 点、线、面的数组层级不同

| 类型         | coordinates 的基本形式  |
| ------------ | ----------------------- |
| Point        | `[经度, 纬度]`          |
| LineString   | `[[经度, 纬度], ...]`   |
| Polygon      | `[外环, 内环, ...]`     |
| MultiPolygon | `[多边形, 多边形, ...]` |

Polygon 的环需要闭合，首尾位置相同。只读取 `coordinates[0]` 会忽略内环；内环可能表达湖面、院落等不属于该面的部分。优先使用标准解析器，不要靠手写数组层级适配所有几何。

## 存储坐标与显示坐标可以不同

经纬度的单位是度，用于描述地球上的角度位置。OpenLayers 的默认 View 使用 EPSG:3857，将位置投到平面地图上。数据进入图层时，需要明确转换关系。

```js
import GeoJSON from "ol/format/GeoJSON.js";
const features = new GeoJSON().readFeatures(data, {
  dataProjection: "EPSG:4326",
  featureProjection: "EPSG:3857",
});
```

这里的 `data` 是前面介绍的 GeoJSON 对象，代码用于独立 OpenLayers 应用。不要先手动转换坐标，再让解析器按原经纬度重新转换，否则会重复投影。

## 单位是米，也不一定适合测距

EPSG:3857 的坐标单位是米，但它为了网页地图显示而广泛使用，不是全球通用的等距或等面积投影。距离比例随纬度变化，直接用它算精确面积或缓冲区可能产生误解。

应先确定分析目的：真实距离可使用测地方法，局部平面分析可选择适合研究区域的投影，面积分析则关注面积畸变。最终可以再把展示几何转回经纬度。

## 从一个点开始排查

当图层出现在错误位置，先检查一个已知点：经纬度有没有颠倒、当前数值到底是度还是米、数据原始坐标系是否明确、转换是否只执行一次。避免同时修改底图、相机和所有坐标，让问题变得难以定位。

继续阅读：[前后端 5 公里缓冲区为什么可能不同](/post/wukong-projection)。
