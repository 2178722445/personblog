import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { load } from "js-yaml";
import editorPlugin from "../server/editor-plugin.js";
import { createDraft, serializeDraft } from "../src/utils/editor.js";

const draft = {
  ...createDraft(),
  title: '学习笔记: "坐标"',
  slug: "test-note",
  tags: "Vue，JavaScript, Vue",
  content: "## 中文正文\n\n```js\nconst value = 1;\n```",
};
const serialized = serializeDraft(draft);
const metadata = load(serialized.split("---\n")[1]);
assert.equal(metadata.title, draft.title);
assert.deepEqual(metadata.tags, ["Vue", "JavaScript"]);
for (const changes of [
  { slug: "../escape" },
  { slug: "UPPER" },
  { date: "2026-02-30" },
  { content: "" },
  { cover: "/images/../secret.webp" },
]) {
  assert.throws(() => serializeDraft({ ...draft, ...changes }));
}
// 发布测试只使用自建临时目录，绝不写入真实文章目录。
const root = await mkdtemp(join(tmpdir(), "hermit-editor-test-"));
let server;
try {
  await mkdir(join(root, "posts"));
  await mkdir(join(root, "public/images"), { recursive: true });
  await writeFile(join(root, "public/images/wukong.webp"), "test");
  server = await createServer({
    configFile: false,
    root,
    plugins: [editorPlugin()],
    appType: "custom",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const publish = (body, origin = base) =>
    fetch(`${base}/api/editor/publish`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "X-Hermit-Editor": "1",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  assert.equal(
    (await (await fetch(`${base}/api/editor/status`)).json()).localPublishing,
    true,
  );
  assert.equal((await publish(draft, "https://example.com")).status, 403);
  assert.equal((await publish({ ...draft, slug: "../escape" })).status, 400);
  assert.equal((await publish("{bad json")).status, 400);
  assert.equal((await publish(draft)).status, 201);
  assert.equal(
    await readFile(join(root, "posts/test-note.md"), "utf8"),
    serialized,
  );
  assert.equal((await publish({ ...draft, title: "不能覆盖" })).status, 409);
  assert.equal(
    await readFile(join(root, "posts/test-note.md"), "utf8"),
    serialized,
  );
  assert.equal(
    (await publish({ ...draft, content: "x".repeat(1000001) })).status,
    413,
  );
  assert.equal((await fetch(`${base}/api/editor/publish`)).status, 404);
  console.log(
    "PASS: editor validation, YAML roundtrip, local publish, origin protection, collision protection, request limits",
  );
} finally {
  await server?.close();
  await rm(root, { recursive: true, force: true });
}
