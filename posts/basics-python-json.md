---
title: "Python 数据处理起步：读取、校验并导出 GeoJSON"
date: "2026-09-06"
series: basics
category: Python 入门
tags: [Python, GeoJSON, 基础学习]
cover: /images/basics-python-json.webp
excerpt: "用标准库完成一次小型数据整理，掌握 UTF-8 文件读取、字段检查、列表筛选和输出，建立可重复的数据处理流程。"
---

## 先从标准库开始

处理空间数据之前，可以先用 Python 标准库读取 GeoJSON，检查字段，再把符合条件的地点另存为新文件。这样能把文件问题、数据结构问题与后续算法问题分开。

```python
import json
from pathlib import Path

source = Path('places.geojson')
with source.open('r', encoding='utf-8-sig') as file:
    data = json.load(file)

if data.get('type') != 'FeatureCollection':
    raise ValueError('需要 FeatureCollection 数据')
if not isinstance(data.get('features'), list):
    raise ValueError('features 必须是数组')
```

示例需要你准备 `places.geojson`，不是博客的运行依赖。`utf-8-sig` 可以读取带 BOM 的 UTF-8 文件；写出时使用普通 UTF-8 即可。

## 不要直接假定每条记录都有合法坐标

```python
import math

def valid_point(feature):
    if not isinstance(feature, dict):
        return False
    geometry = feature.get('geometry')
    if not isinstance(geometry, dict) or geometry.get('type') != 'Point':
        return False
    coords = geometry.get('coordinates')
    if not isinstance(coords, list) or len(coords) < 2:
        return False
    lng, lat = coords[:2]
    # bool 是 int 的子类，坐标校验时应明确排除
    if any(isinstance(v, bool) or not isinstance(v, (int, float))
           or not math.isfinite(v) for v in (lng, lat)):
        return False
    return -180 <= lng <= 180 and -90 <= lat <= 90

valid = [feature for feature in data['features'] if valid_point(feature)]
print(f"保留 {len(valid)} 条，排除 {len(data['features']) - len(valid)} 条")
```

这个函数只做 WGS84 Point 的基本检查，不能证明坐标与真实地点匹配，也不处理多边形。根据任务收窄验证范围，比让一个简单函数假装支持所有空间数据更可靠。

## 输出新文件，保留原始数据

```python
result = {'type': 'FeatureCollection', 'features': valid}
target = Path('places-clean.geojson')
with target.open('x', encoding='utf-8') as file:
    json.dump(result, file, ensure_ascii=False, indent=2, allow_nan=False)
```

`ensure_ascii=False` 保留可读中文；`indent=2` 让结构更清晰；`allow_nan=False` 防止输出不符合标准 JSON 的特殊数值。`x` 模式在文件已经存在时抛出异常，不会无意覆盖之前的结果。

## 记录处理前后的差异

不要只记录“脚本运行成功”。至少保留输入数量、输出数量和排除原因。数据量较大时可以把错误记录写到单独文件，方便检查是否误删了有效数据。

当任务进入投影转换、几何运算或空间连接，再引入 GeoPandas、Shapely 等成熟库。标准库适合数据结构整理，不替代空间算法库。

练习：准备正常点、空 geometry、纬度越界和字符串坐标各一条，检查最终只保留合法点。然后阅读 [GeoJSON 与坐标系基础](/post/basics-geojson-crs)。
