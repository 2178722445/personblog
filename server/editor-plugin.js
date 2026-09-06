import { writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { serializeDraft } from "../src/utils/editor.js";

export default function editorPlugin() {
  let root;
  return {
    name: "hermit-local-editor",
    apply: "serve",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use("/api/editor", async (req, res, next) => {
        const reply = (status, data) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(data));
        };
        // 仅允许本机同源写入，不把无鉴权的写文件接口暴露给局域网或其他网页。
        const loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
        let host;
        try {
          host = new URL(`http://${req.headers.host}`);
        } catch {
          return reply(403, { error: "仅支持本机访问" });
        }
        if (
          !loopback.includes(req.socket.remoteAddress) ||
          !["127.0.0.1", "localhost", "[::1]"].includes(host.hostname)
        )
          return reply(403, { error: "仅支持本机访问" });
        if (req.method === "GET" && req.url === "/status")
          return reply(200, { localPublishing: true });
        if (req.method !== "POST" || req.url !== "/publish") return next();
        if (
          req.headers.origin !== host.origin ||
          req.headers["x-hermit-editor"] !== "1" ||
          !req.headers["content-type"]?.startsWith("application/json")
        )
          return reply(403, { error: "发布请求必须来自本机博客页面" });
        try {
          const chunks = [];
          let bytes = 0;
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes > 1000000) return reply(413, { error: "文章数据过大" });
            chunks.push(Buffer.from(chunk));
          }
          const draft = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const markdown = serializeDraft(draft);
          await access(resolve(root, "public", draft.cover.slice(1)));
          // wx 原子创建，重名文章明确拒绝，绝不覆盖原有笔记。
          await writeFile(
            resolve(root, "posts", `${draft.slug}.md`),
            markdown,
            { encoding: "utf8", flag: "wx" },
          );
          return reply(201, { slug: draft.slug });
        } catch (error) {
          if (error.code === "EEXIST")
            return reply(409, { error: "文章地址已存在，请修改地址后发布" });
          if (error.code === "ENOENT")
            return reply(400, { error: "封面或文章目录不存在" });
          return reply(400, {
            error:
              error instanceof SyntaxError ? "文章数据格式错误" : error.message,
          });
        }
      });
    },
  };
}
