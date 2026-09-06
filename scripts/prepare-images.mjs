import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// 原始项目文件只读；博客使用压缩后的独立副本，部署不依赖相邻文件夹。
await mkdir("public/images", { recursive: true });
const images = [
  ["c2daf5e9c09e618eac392b77ca458521.jpg", "avatar", 320],
  [
    "../Campus-GIS-Path-Optimization-main/visuals/等时圈分析三维可视化结果.png",
    "campus",
    1440,
  ],
  [
    "../Campus-GIS-Path-Optimization-main/visuals/最短路径三维可视化结果.png",
    "campus-path",
    1280,
  ],
  [
    "../Campus-GIS-Path-Optimization-main/visuals/盲区识别三维可视化结果.png",
    "campus-blind",
    1280,
  ],
  [
    "../Campus-GIS-Path-Optimization-main/visuals/三维第一人称演示最短路径结果.png",
    "campus-tour",
    1280,
  ],
  ["../wukong-travel/visual/主页面预览.png", "wukong", 1440],
  ["../wukong-travel/visual/缓冲区分析预览.png", "wukong-buffer", 1280],
  ["../wukong-travel/visual/路径规划预览.png", "wukong-route", 1280],
  ["../wukong-travel/visual/行程规划预览.png", "wukong-itinerary", 1280],
];
for (const [source, name, width] of images) {
  const info = await sharp(resolve(source))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(`public/images/${name}.webp`);
  console.log(`${name}: ${Math.round(info.size / 1024)} KB`);
}
