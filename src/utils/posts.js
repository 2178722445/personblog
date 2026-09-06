import { load } from "js-yaml";

// glob 让新增 Markdown 自动进入列表；正文渲染器只在文章路由加载。
const modules = import.meta.glob("../../posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export function parsePost(raw, path) {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  const meta = match ? load(match[1]) || {} : {};
  const content = match ? match[2] : normalized;
  const slug = path.split("/").pop().replace(/\.md$/, "");
  const tags = Array.isArray(meta.tags)
    ? meta.tags
    : String(meta.tags || "")
        .split(",")
        .filter(Boolean);
  return {
    slug,
    content,
    tags: tags.map((tag) => String(tag).trim()),
    title: String(meta.title || slug),
    date:
      meta.date instanceof Date
        ? meta.date.toISOString().slice(0, 10)
        : String(meta.date || ""),
    cover: String(meta.cover || "/images/campus.webp"),
    excerpt: String(
      meta.excerpt ||
        content
          .replace(/[#*`>]/g, "")
          .trim()
          .slice(0, 110),
    ),
    series: String(meta.series || "notes"),
    category: String(meta.category || "技术随笔"),
    featured: meta.featured === true,
    minutes: Math.max(
      2,
      Math.ceil(content.replace(/```[\s\S]*?```/g, "").length / 350),
    ),
  };
}

export const posts = Object.entries(modules)
  .map(([path, raw]) => parsePost(raw, path))
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
export const allTags = [...new Set(posts.flatMap((post) => post.tags))];
export const getPostBySlug = (slug) => posts.find((post) => post.slug === slug);
