---
title: "从 5 分钟步行圈到服务覆盖：等时圈到底表达了什么"
date: "2026-09-06"
series: campus
category: 可达性分析
tags: [Python, NetworkX, 空间分析]
cover: /images/campus.webp
excerpt: "Dijkstra 扩散、时间权重和凸包生成，构成了校园等时圈的核心链路。把覆盖范围画出来之后，还要理解它的近似与边界。"
---

> 源码复盘：依据智慧校园 `scripts/isochrone_analysis.py` 中的 `_build_road_graph`、`_isochrone_from_node`。本文讨论代码能支持的结论，不把凸包近似当作精确可达区域。

## 圆形缓冲区与步行等时圈

以食堂为中心画一个半径 500 米的圆，可以回答“哪些位置离食堂很近”，却不能回答“沿校园道路走 5 分钟能到哪里”。围墙、道路弯折以及缺少通道，都可能让直线很近的位置需要绕行。

项目选择路网扩散：用每段道路的长度除以 `1.2 m/s` 得到秒数，再以 `300`、`600`、`900` 秒作为阈值运行 Dijkstra。这使算法的边权从距离变成了时间。

```python
# 现有核心逻辑：距离单位需与速度的米/秒一致
graph.add_edge(p1, p2, weight=dist / 1.2)
reachable = nx.single_source_dijkstra_path_length(
    graph, source_node, cutoff=300, weight='weight'
)
```

## 为什么要把可达节点变成一个面

搜索结果本来是一组节点及其最短到达时间。三维地图需要连续的覆盖区域，因此脚本对节点坐标生成 `MultiPoint(...).convex_hull`，再投影回经纬度。

优点是实现短、易于渲染，且三个时间阈值能形成直观的层次。代价是凸包会跨过节点之间的空隙：两个可达的路网分支之间如果存在围墙、封闭建筑或湖面，凸包仍可能把它们全部包进去。

所以这里的面应理解为**可达节点的几何包络**，而不是“面内每一个点都可以在指定时间内走到”。

## 三个节点也可能不能组成多边形

源码检查了 `len(subgraph_nodes) < 3`，但三个以上节点仍可能共线。Shapely 在这种情况下返回的是 `LineString`，不是 `Polygon`。后续若只按面几何处理，就会出现结果为空或样式不匹配。

```python
# 建议：不仅检查点数，还检查最终几何类型
hull = MultiPoint(list(reachable)).convex_hull
if hull.is_empty or hull.geom_type != 'Polygon':
    continue
```

更完整的产品可以提示“当前阈值下的可达道路不足以形成面”，或者直接返回可达路段，让退化情况也有可解释的显示。

## 一次搜索可以支持三个阈值

现有实现分别搜索 300、600、900 秒。若图和中心点不变，可以先按最大阈值计算一次距离表，再按时间筛选节点。这样减少重复工作，并且让三个层级使用同一份最短到达时间。

```python
# 建议的等价节点筛选流程
times = nx.single_source_dijkstra_path_length(
    graph, source_node, cutoff=900, weight='weight'
)
for limit in (300, 600, 900):
    nodes = [node for node, seconds in times.items() if seconds <= limit]
    # 再检查节点数、几何类型并生成输出
```

如果需要更贴近道路的覆盖面，可以在阈值穿过路段时插值截断可达部分，再对可达道路做适当缓冲并合并。缓冲宽度同样是一项模型假设，需要随结果说明。

## 在三维地图中阅读结果

项目将 5、10、15 分钟分别标为绿、黄、红，并附带 `value`、`level`、`label` 和 `geometry`。保留阈值元数据很重要：颜色只是视觉编码，目录、弹窗和图例仍应告诉读者它对应多少分钟。

验证时可以选一个 T 形路网：短阈值只到一条支路，中阈值触及路口，长阈值覆盖更多分支。检查节点集合随阈值扩大而包含前一层，并观察凸包是否包住了无法直接进入的区域。

还需验证空图、孤立节点、共线道路和设施远离路网的情况。距离投影、步行速度与吸附距离都会影响结果，不能只验证“颜色正常显示”。

## 源码位置

- `Campus-GIS-Path-Optimization-main/scripts/isochrone_analysis.py`：路网时间权重、阈值搜索与凸包。
- `Campus-GIS-Path-Optimization-main/index.html`：分析结果与图例渲染。
- [继续阅读：路网为什么不连通](/post/campus-path)。
