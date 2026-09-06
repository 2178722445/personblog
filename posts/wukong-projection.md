---
title: "同样是 5 公里，Turf 与后端缓冲区为什么可能不重合"
date: "2026-09-06"
series: wukong
category: 坐标与投影
tags: [Turf.js, OpenLayers, Python, GeoJSON]
cover: /images/wukong-buffer.webp
excerpt: "经纬度存储、Web Mercator 显示和真实距离计算是三件事。对照前后端代码，理解单位、投影畸变与缓冲区边界的差异。"
---

> 源码复盘：对照 `client/src/utils/spatial.ts`、`OLViewer.vue` 与 `server/services/spatial_service.py`。前后端实现同时存在于目录中，但不能据此认定每次页面操作都调用了后端分析。

## 项目里有哪些坐标

取景地保存 `lng` 和 `lat`，传给 Turf 时使用 `[经度, 纬度]`。OpenLayers 的默认视图使用 Web Mercator，标记通过 `fromLonLat` 转换到地图坐标。Cesium 则通过 `Cartesian3.fromDegrees` 接收角度并转换到三维空间。

| 使用位置             | 坐标形式                     | 单位     |
| -------------------- | ---------------------------- | -------- |
| 取景地数据 / GeoJSON | WGS84 经度、纬度             | 度       |
| OpenLayers 默认视图  | EPSG:3857                    | 投影米   |
| Turf 距离接口        | 经纬度输入，显式指定输出单位 | 米或千米 |
| Cesium 场景内部      | 地心地固笛卡尔坐标           | 米       |

一个数值“看起来像米”不够，必须知道它在哪个坐标参考系里。

## 前端的圆与后端的圆

前端 `createBuffer` 使用 `turfCircle`，将输入米转换成千米，以 64 段近似圆。返回值仍是经纬度 GeoJSON。

```js
// 现有前端实现
return turfCircle([lng, lat], radiusMeters / 1000, {
  steps: 64,
  units: "kilometers",
});
```

后端先把点投影到 `EPSG:3857`，用 Shapely 在平面中执行 `.buffer(radius_meters)`，再转回经纬度。这个圆的半径是“Web Mercator 投影米”，不是对应纬度下的真实地面米。

在球面近似下，Mercator 的局部比例尺约为 `1 / cos(纬度)`。北纬约 37 度时，投影平面 5 公里大约只对应地面 4 公里。因此两种结果不应被默认当成同一分析口径。这里是理论估算，不是对该项目数据的实测误差报告。

## 统一口径比调透明度更有效

若用户输入表示真实半径，应选择一致的距离模型。可以让前后端都使用同一套经纬度球面距离规则，或者以后端的合适投影 / 测地方法作为唯一分析来源，前端只负责显示返回的几何。

如果使用以分析中心为原点的方位等距投影，可保持从中心到其他位置的距离，再在该投影中生成缓冲区。实际采用前要确认研究范围与库的精度要求。

对于数据库半径查询，PostGIS 的 `geography` 也是一个可选方向；它不是当前前端 Turf 代码的等价替换，查询、单位和返回几何都需一起验证。

## 边界点与几何洞也会影响结果

前端用多边形近似圆并执行点面判断。后端使用 Shapely 的 `contains`，边界点不包含在结果内。如果产品定义是“小于等于半径”，就应明确边界策略，并避免由多边形分段精度偶然决定地点归属。

OpenLayers 的 `drawBuffer` 当前手动取 `geom.coordinates[0]`。这对简单圆的外环可用，但会丢掉内环，且不适用于 `MultiPolygon`。需要扩展几何类型时，建议使用标准 GeoJSON 解析器：

```js
import GeoJSON from "ol/format/GeoJSON.js";

const feature = new GeoJSON().readFeature(geojsonFeature, {
  dataProjection: "EPSG:4326",
  featureProjection: map.getView().getProjection(),
});
```

`geojsonFeature` 在这里是包含 geometry 的标准 GeoJSON Feature，而不是未经包装的业务响应。

## 验证方式

围绕同一个中心，在东南西北分别构造略小于、等于和略大于目标距离的测试点。比较前端判定、后端判定和地面距离，而不仅是两层圆在屏幕上的重叠程度。

再检查 `[lng, lat]` 是否被颠倒、投影是否被重复转换，以及跨 180 度经线和高纬度的适用范围。浏览器用于展示，分析用于回答问题，二者的坐标选择可以不同，但转换必须明确。

## 源码位置

- `wukong-travel/client/src/utils/spatial.ts`：`createBuffer`、`distanceBetween`、`projectCoordinate`。
- `wukong-travel/server/services/spatial_service.py`：`buffer_analysis`、`find_locations_in_buffer`。
- `wukong-travel/client/src/components/openlayers/OLViewer.vue`：`drawBuffer`。
