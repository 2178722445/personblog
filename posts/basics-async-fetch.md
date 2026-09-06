---
title: "从 Promise 到 async/await：可靠地加载第一份地图数据"
date: "2026-09-06"
series: basics
category: JavaScript 入门
tags: [JavaScript, 异步请求, 基础学习]
cover: /images/basics-async-fetch.webp
excerpt: "理解等待、失败和取消的区别，为数据加载补上 HTTP 状态检查、加载反馈和过期请求处理。"
---

## 异步代码在等待什么

网络请求需要时间。Promise 表达一个尚未完成的结果，`await` 暂停当前异步函数的后续执行，让浏览器仍能响应滚动与点击。它不会把整个页面变成同步程序。

`async` 函数总是返回 Promise；函数里抛出的错误会使这个 Promise 变成拒绝状态，需要由调用方处理。

## fetch 不会因为所有 HTTP 错误都抛异常

```js
async function loadPlaces(signal) {
  // /api/locations 是业务接口示意，需要对应后端支持
  const response = await fetch("/api/locations", { signal });
  if (!response.ok) {
    throw new Error(`请求失败：HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.locations)) {
    throw new Error("地点数据格式不正确");
  }
  return data.locations;
}
```

`404`、`500` 通常仍会得到 Response，因此需要检查 `response.ok`。网络中断、主动取消、JSON 格式错误属于不同失败来源，不应都显示成“没有数据”。

## 把加载状态放在 finally 中恢复

页面通常至少有四种状态：尚未加载、加载中、成功与失败。成功又可能包含空列表，这是合法结果。

```js
async function refresh() {
  loading.value = true;
  error.value = "";
  try {
    places.value = await loadPlaces();
  } catch (exception) {
    error.value = exception.message;
  } finally {
    loading.value = false;
  }
}
```

这段是 Vue 状态管理示意，`loading`、`error`、`places` 需要预先用 `ref` 定义。`finally` 不代表成功，而是无论成功失败都会执行的收尾。

## 后发请求可能先返回

快速切换两个城市时，第一次请求可能更慢，最后覆盖第二次结果。可以同时使用 AbortController 和请求序号：取消减少无用工作，序号保证只有最新任务有权更新状态。

```js
let controller;
let version = 0;
async function refreshLatest() {
  const current = ++version;
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  error.value = "";
  try {
    const result = await loadPlaces(controller.signal);
    if (current === version) places.value = result;
  } catch (exception) {
    if (current === version && exception.name !== "AbortError") {
      error.value = exception.message;
    }
  } finally {
    if (current === version) loading.value = false;
  }
}
```

退出页面时还要取消请求，并使版本失效。检验时可以用浏览器网络面板模拟慢速网络，连续发起请求，确认旧任务不会改写最新状态。

延伸阅读：[三维巡览中的异步采样问题](/post/campus-tour)。
