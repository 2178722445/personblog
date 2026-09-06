import { dump } from "js-yaml";

export function createDraft() {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: `note-${Date.now()}`,
    date,
    series: "basics",
    category: "学习笔记",
    tags: "",
    excerpt: "",
    cover: "/images/wukong.webp",
    content: "",
    updatedAt: "",
  };
}

// 浏览器与本地发布接口共用校验规则，避免只校验前端。
export function validateDraft(draft) {
  if (!draft || typeof draft !== "object") throw new Error("文章数据格式错误");
  for (const key of [
    "title",
    "slug",
    "date",
    "series",
    "category",
    "tags",
    "excerpt",
    "cover",
    "content",
  ]) {
    if (typeof draft[key] !== "string") throw new Error(`字段 ${key} 格式错误`);
  }
  if (!draft.title.trim() || draft.title.length > 120)
    throw new Error("标题需为 1–120 个字符");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) || draft.slug.length > 100)
    throw new Error("文章地址仅支持小写字母、数字和单横线，最长 100 字符");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
    !Number.isFinite(Date.parse(draft.date)) ||
    new Date(draft.date).toISOString().slice(0, 10) !== draft.date
  )
    throw new Error("请选择有效日期");
  if (!["basics", "campus", "wukong", "notes"].includes(draft.series))
    throw new Error("请选择有效分类");
  if (!draft.content.trim()) throw new Error("正文还没有内容");
  if (draft.content.length > 200000)
    throw new Error("正文超过 20 万字符，请拆分为多篇文章");
  if (
    draft.tags.length > 300 ||
    draft.excerpt.length > 500 ||
    draft.category.length > 50
  )
    throw new Error("标签、摘要或栏目名称过长");
  if (!/^\/images\/[a-z0-9-]+\.webp$/.test(draft.cover))
    throw new Error("请选择已有封面");
  return draft;
}

export function serializeDraft(draft) {
  validateDraft(draft);
  const metadata = {
    title: draft.title.trim(),
    date: draft.date,
    series: draft.series,
    category: draft.category.trim() || "学习笔记",
    tags: [
      ...new Set(
        draft.tags
          .split(/[,，]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ],
    cover: draft.cover,
    excerpt:
      draft.excerpt.trim() ||
      draft.content
        .replace(/[#*`>]/g, "")
        .trim()
        .slice(0, 110),
  };
  return `---\n${dump(metadata, { lineWidth: -1, noRefs: true })}---\n\n${draft.content.trim()}\n`;
}
