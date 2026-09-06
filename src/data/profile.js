// 个人资料与项目入口统一维护，邮箱为本人确认后的完整地址。
export const profile = {
  name: "HERMIT",
  email: "Hermit.Zh9@gmail.com",
  github: "https://github.com/2178722445",
  avatar: "/images/avatar.webp",
  introduction: "你好，我是 HERMIT，一个热爱地图可视化的地理信息科学专业学生。",
};

export const projects = [
  {
    id: "campus",
    number: "01",
    name: "智慧校园 · 三维空间分析",
    shortName: "智慧三维",
    english: "SMART CAMPUS",
    color: "green",
    description: "从校园路网出发，探索最短路径、步行等时圈与三维第一人称巡览。",
    cover: "/images/campus.webp",
    repository: "https://github.com/2178722445/Campus-GIS-Path-Optimization",
    tags: ["Cesium", "Python", "NetworkX"],
  },
  {
    id: "wukong",
    number: "02",
    name: "黑神话：悟空 · 山西漫游",
    shortName: "悟空旅游",
    english: "WUKONG TRAVEL",
    color: "blue",
    description:
      "串联山西取景地，用二维与三维地图连接古建、空间分析与旅行规划。",
    cover: "/images/wukong.webp",
    repository: "https://github.com/2178722445/WuKong-Travel-",
    tags: ["Vue 3", "OpenLayers", "Turf.js"],
  },
];
