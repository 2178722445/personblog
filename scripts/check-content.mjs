import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "vite";
import { marked } from "marked";

// 通过 Vite 实际展开 glob，验证文章来源、Windows 换行和站内链接。
const server = await createServer({
  // 内容测试不复用正在运行的开发服务缓存，避免依赖重新预构建干扰页面。
  cacheDir: "node_modules/.vite-content-check",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { posts, parsePost } = await server.ssrLoadModule(
    "/src/utils/posts.js",
  );
  const windowsPost = parsePost(
    '\uFEFF---\r\ntitle: "标题: 冒号"\r\ndate: "2026-09-06"\r\ntags: [Vue 3, Python]\r\n---\r\n## 正文',
    "windows.md",
  );
  assert.equal(windowsPost.title, "标题: 冒号");
  assert.deepEqual(windowsPost.tags, ["Vue 3", "Python"]);
  assert.equal(windowsPost.content, "## 正文");
  const slugs = new Set(posts.map((post) => post.slug));
  assert.ok(posts.filter((post) => post.series === "basics").length >= 6);
  assert.equal(slugs.size, posts.length, "文章 slug 必须唯一");
  for (const series of ["campus", "wukong"])
    assert.ok(
      posts.filter((post) => post.series === series).length >= 4,
      `${series} 应包含完整专题`,
    );
  for (const post of posts) {
    assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(
      post.title && post.excerpt && post.content && post.tags.length,
      post.slug,
    );
    await access(join("public", post.cover));
    const tokens = marked.lexer(post.content);
    const localImages = [];
    marked.walkTokens(tokens, (token) => {
      if (token.type === "link" && token.href.startsWith("/post/"))
        assert.ok(
          slugs.has(token.href.slice(6)),
          `失效文章链接: ${token.href}`,
        );
      if (token.type === "image" && token.href.startsWith("/"))
        localImages.push(token.href);
    });
    for (const image of localImages) await access(join("public", image));
  }
  console.log(
    `PASS: ${posts.length} 篇文章、2 个专题、封面与站内文章链接、YAML/CRLF 解析`,
  );
} finally {
  await server.close();
}
