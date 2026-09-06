import { Marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import "highlight.js/styles/github.css";

for (const [name, language] of Object.entries({
  javascript,
  typescript,
  python,
  json,
  bash,
  xml,
  css,
}))
  hljs.registerLanguage(name, language);
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderMarkdown(content) {
  const headings = [];
  const parser = new Marked({
    gfm: true,
    renderer: {
      // marked 14 已移除旧 highlight 选项，使用 renderer.code 明确生成高亮。
      code({ text, lang }) {
        const language = String(lang || "").split(/\s/)[0];
        const code = hljs.getLanguage(language)
          ? hljs.highlight(text, { language }).value
          : escapeHtml(text);
        return `<div class="code-block"><div class="code-toolbar"><span>${escapeHtml(language || "text")}</span><span class="code-action"></span></div><pre><code class="hljs">${code}</code></pre></div>`;
      },
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const id = `heading-${headings.length}`;
        const text =
          new DOMParser().parseFromString(html, "text/html").body.textContent ||
          "";
        headings.push({ id, text, depth });
        return `<h${depth} id="${id}">${html}</h${depth}>`;
      },
    },
  });
  return { html: DOMPurify.sanitize(parser.parse(content)), headings };
}
