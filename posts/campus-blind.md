---
title: "服务盲区分析：一个导入顺序错误，和一处容易忽略的面积单位"
date: "2026-09-06"
series: campus
category: 问题复盘
tags: [Python, GeoJSON, 空间分析]
cover: /images/campus-blind.webp
excerpt: "从 Polygon 的局部导入错误入手，继续追踪校园边界、覆盖区差集与面积计算，理解一个空间分析结果如何才算可信。"
---

> 源码复盘：依据 `scripts/blind_spot_analysis.py` 的当前文件。截图记录项目已有的可视化状态，不代表当前目录中的源码已经通过下述测试。修正代码为建议方案。

## 先定义“盲区”

智慧校园项目把食堂 15 分钟服务圈合并，再从校园边界中减去覆盖部分。这个差集用于表达未被当前服务模型覆盖的区域：

```text
盲区 = 校园边界 - 所有设施服务圈的并集
```

如果服务圈来自可达节点的凸包，盲区也继承了这项近似。它反映的是模型下的覆盖空白，不直接等于现实中的设施短缺程度。

## Polygon 为什么还没运行就报错

源码在函数中先使用 `Polygon(...)` 构造边界，随后才写 `from shapely.geometry import Polygon`。Python 把函数内的导入当作局部名称绑定，因此此前的 `Polygon` 读取会发生 `UnboundLocalError`。

```python
# 原有顺序的缩略示意
def analyze(features):
    polygons = [Polygon(f['geometry']['coordinates'][0]) for f in features]
    from shapely.geometry import Polygon
```

修正导入位置只是第一步。原代码只取 `coordinates[0]` 作为外环，会丢失多边形内部的洞。更合适的做法是使用 Shapely 的 GeoJSON 解析器，让标准格式保留完整几何。

```python
# 建议：统一放在模块顶部，并通过 shape 解析外环和内环
from shapely.geometry import shape
from shapely.ops import unary_union

boundary_parts = [shape(feature['geometry']) for feature in poly_features]
boundary = unary_union(boundary_parts)
```

真实数据还要检查无效几何，并在修复后确认类型。`make_valid` 可能返回 `GeometryCollection`，不能假设修复结果一定还是单个多边形。

## 差集不一定是单个 Polygon

一个校园可能有多个独立区域，覆盖范围也可能把盲区分成多块。差集可能为空、是 `Polygon`，也可能是 `MultiPolygon`。若之前的几何修复产生线或点，还需要按类型过滤。

项目已有空结果与多面分支，值得保留。前端应把“没有盲区”和“分析失败”作为不同状态显示，不能都归结为没有图层。

## 平方度不是平方米

源码把覆盖范围投回 `EPSG:4326` 后执行 `.area`，输出描述也明确使用“平方度”。这在单位标注上没有伪装，但对面积比较不直观，也不适合直接变成平方米。

如果需要报告面积，建议在适合该区域的米制投影中完成面积计算，最好选用面积失真较小的本地方案；然后仅把展示几何转回经纬度。不要把 `EPSG:3857` 当作通用的等面积投影。

```python
# 改进流程示意：分析投影根据研究区域选择
boundary_local = boundary_gdf.to_crs(analysis_crs)
coverage_local = coverage_gdf.to_crs(analysis_crs)
blind = boundary_local.geometry.iloc[0].difference(
    unary_union(coverage_local.geometry)
)
area_m2 = blind.area
# geometry 单独转回 EPSG:4326，value 保留已经计算的平方米
```

## 一个可手算的验证用例

在同一个米制平面中，校园是边长 100 米的正方形，覆盖区域是其左半边的 50 × 100 米矩形。差集应为右半边，面积为 5000 平方米。

再逐一验证完全覆盖、完全无覆盖、带洞边界与多校区。带洞边界尤其能检验 `shape` 是否保留了原始数据语义。最后再接真实校园数据，确认图层和数值表达的是同一块几何。

## 源码位置

- `Campus-GIS-Path-Optimization-main/scripts/blind_spot_analysis.py`：导入顺序、边界解析、差集与平方度输出。
- [等时圈的模型边界](/post/campus-isochrone)。
