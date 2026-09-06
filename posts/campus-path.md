---
title: "路网看似相连，Dijkstra 为什么找不到路径？"
date: "2026-09-06"
series: campus
category: 路网建模
tags: [Python, NetworkX, 空间分析]
cover: /images/campus-path.webp
featured: true
excerpt: "从智慧校园的最短路径脚本出发，拆解道路建图、最近节点吸附和同节点退化问题。路径规划的第一步，是让数据真正连起来。"
---

> 源码复盘：智慧校园 GIS 空间分析系统。依据 `scripts/dijkstra_path_analysis.py` 中的 `run_dijkstra_path` 整理。下面区分现有实现和建议修改；未将建议写回原项目。

## 从一条校园步行路线说起

在三维校园里点击起点和终点，地图需要返回一条沿道路行走的路线。这件事可以拆成四步：把道路变成图、把点击位置接入图、计算路径、把结果放回地球。

项目读取路网后转换到 `EPSG:3857`，将每条道路的相邻坐标作为无向图的一条边，以坐标点之间的距离为权重，再交给 NetworkX 计算。最终输出 `LineString`，转换回 `EPSG:4326` 供 Cesium 展示。

```python
# 现有实现的核心逻辑（省略文件读写）
graph = nx.Graph()
for _, row in roads.iterrows():
    coords = list(row.geometry.coords)
    for p1, p2 in zip(coords, coords[1:]):
        graph.add_edge(p1, p2, weight=Point(p1).distance(Point(p2)))

path_nodes = nx.shortest_path(
    graph, source=source_node, target=target_node, weight='weight'
)
```

## 道路相交，不等于图上的节点相连

这段实现按**完全相同的坐标元组**识别节点。两条线在屏幕上交叉，如果交叉位置没有被切成公共节点，就属于两个不同的连通部分。相距很近但数值不同的端点，也不会自动连接。

排查时应先看拓扑，再看算法。可以用 `nx.number_connected_components(graph)` 统计连通分量，检查起终点是否属于同一分量；同时叠加绘制道路顶点，确认交叉口有没有公共节点。

建议在导入阶段做道路清洗：拆开 `MultiLineString`，处理交叉口、重复边、空几何和端点吸附。桥梁与地下通道不能仅凭平面交叉就连通，必须结合道路层级判断。

## 最近节点吸附的两个边界

项目用 `min(nodes, key=distance)` 把点击位置吸附到最近路网节点。校园规模下实现直观，但有两个需要明确的结果。

第一，远离校园的任意点击仍会被吸到某个节点。应计算吸附距离并设置阈值，超过阈值时提示重新选点。第二，两个点击可能吸到同一个节点，此时最短路径仅含一个坐标，直接创建 `LineString(path_nodes)` 会遇到退化几何问题。

```python
# 建议：在构造 LineString 之前处理同节点情况
if source_node == target_node:
    return {
        'status': 'same_node',
        'distance_m': 0,
        'message': '起终点吸附到同一路网节点，请重新选择。'
    }
```

这个片段是接口改进示意，接入时要同步修改 Flask 响应和前端空结果处理，不能直接替换现有返回列表的函数。

## 米制坐标，还需要说明精度

`EPSG:3857` 的单位为米，但其比例尺随纬度变化，并不等于当地真实地面距离。项目用 `path_length / 72` 估算分钟数，即假定步行速度为每分钟 72 米。

对于教学展示，这条链路便于理解；对于需要可信距离和时长的分析，应让道路与点击点统一转换到适合研究区域的本地投影，例如结合数据范围选择 UTM，并明确坡度、楼梯和通行限制尚未进入权重。

## 怎样验证修改后的路径

| 场景               | 需要观察的结果               |
| ------------------ | ---------------------------- |
| 同一道路上两个点   | 路径连续，距离为正           |
| 同节点附近点击两次 | 返回明确提示，不构造单点折线 |
| 位于两个断开分量   | 提示路网不连通               |
| 校园外很远的点击   | 超过吸附阈值后拒绝计算       |
| 已知交叉路口       | 路径能经过真实存在的公共节点 |

算法库负责最短路径，开发者负责定义什么叫“道路相连”和“可以通行”。数据模型确定了算法最终能回答的问题。

## 源码位置

- `Campus-GIS-Path-Optimization-main/scripts/dijkstra_path_analysis.py`：建图、吸附与路径输出。
- `Campus-GIS-Path-Optimization-main/app.py`：`/api/analysis/path` 接口。
- [项目仓库](https://github.com/2178722445/Campus-GIS-Path-Optimization)。
