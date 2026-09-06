<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { onBeforeRouteLeave } from "vue-router";
import {
  EditPen,
  View,
  Download,
  Upload,
  Plus,
  DocumentChecked,
  Delete,
  Back,
  Right,
  Link,
  Picture,
  List,
  Reading,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { createDraft, serializeDraft } from "../utils/editor";
import { renderMarkdown } from "../utils/markdown";

const storageKey = "hermit-writing-drafts-v1";
const drafts = ref([]);
const draft = ref(createDraft());
const status = ref("尚未保存");
const error = ref("");
const mode = ref("split");
const textarea = ref(null);
const importer = ref(null);
const publishing = ref(false);
const canPublish = ref(false);
const history = ref([]);
const future = ref([]);
const previewBody = ref("");
const previewHtml = computed(() => renderMarkdown(previewBody.value).html);
const words = computed(() => draft.value.content.replace(/\s/g, "").length);
let saveTimer;
let previewTimer;
let stopped = false;
let pending = false;

function saveDraft() {
  clearTimeout(saveTimer);
  if (!pending) return true;
  const saved = { ...draft.value, updatedAt: new Date().toISOString() };
  const list = [saved, ...drafts.value.filter((item) => item.id !== saved.id)];
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ current: saved.id, items: list }),
    );
    drafts.value = list;
    pending = false;
    status.value = `草稿已保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    return true;
  } catch {
    status.value = "草稿未保存";
    error.value = "浏览器存储不可用或空间不足，请导出 Markdown 备份。";
    return false;
  }
}

function switchDraft(id) {
  if (!saveDraft()) return;
  const selected = drafts.value.find((item) => item.id === id);
  if (selected) draft.value = { ...selected };
  history.value = [];
  future.value = [];
}
function newDraft() {
  if (!saveDraft()) return;
  draft.value = createDraft();
  history.value = [];
  future.value = [];
}
function deleteDraft() {
  if (!window.confirm("确定删除当前草稿？此操作不会删除已发布的文章。")) return;
  const remaining = drafts.value.filter((item) => item.id !== draft.value.id);
  try {
    const next = remaining[0] || createDraft();
    localStorage.setItem(
      storageKey,
      JSON.stringify({ current: next.id, items: remaining }),
    );
    clearTimeout(saveTimer);
    drafts.value = remaining;
    draft.value = { ...next };
    history.value = [];
    future.value = [];
    error.value = "";
  } catch {
    error.value = "删除失败：浏览器存储不可用。";
  }
}
watch(
  draft,
  () => {
    pending = true;
    status.value = "保存中…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 500);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      previewBody.value = draft.value.content;
    }, 180);
  },
  { deep: true, flush: "sync" },
);

// 输入历史保留最近 100 步，同时支持工具栏插入和撤销。
function setContent(value) {
  if (value !== draft.value.content) {
    history.value.push(draft.value.content);
    if (history.value.length > 100) history.value.shift();
    future.value = [];
  }
  draft.value.content = value;
}
function undo() {
  if (!history.value.length) return;
  future.value.push(draft.value.content);
  draft.value.content = history.value.pop();
}
function redo() {
  if (!future.value.length) return;
  history.value.push(draft.value.content);
  draft.value.content = future.value.pop();
}
async function insert(before, after = "", fallback = "") {
  const field = textarea.value;
  const start = field?.selectionStart ?? draft.value.content.length;
  const end = field?.selectionEnd ?? start;
  const selected = draft.value.content.slice(start, end) || fallback;
  setContent(
    draft.value.content.slice(0, start) +
      before +
      selected +
      after +
      draft.value.content.slice(end),
  );
  if (mode.value === "preview") mode.value = "edit";
  await nextTick();
  textarea.value?.focus();
  textarea.value?.setSelectionRange(
    start + before.length,
    start + before.length + selected.length,
  );
}
const tools = [
  { title: "二级标题", text: "H2", before: "\n## ", fallback: "章节标题" },
  { title: "加粗", text: "B", before: "**", after: "**", fallback: "重点内容" },
  { title: "斜体", text: "I", before: "*", after: "*", fallback: "强调内容" },
  {
    title: "代码块",
    text: "</>",
    before: "\n```js\n",
    after: "\n```\n",
    fallback: "// 示例代码",
  },
  { title: "列表", icon: List, before: "\n- ", fallback: "列表项" },
  {
    title: "链接",
    icon: Link,
    before: "[",
    after: "](https://example.com)",
    fallback: "链接文字",
  },
  {
    title: "图片",
    icon: Picture,
    before: "![",
    after: "](/images/wukong.webp)",
    fallback: "图片描述",
  },
];
function download() {
  try {
    const content = serializeDraft(draft.value);
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.value.slug}.md`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    error.value = "";
    ElMessage.success("Markdown 已导出");
  } catch (exception) {
    error.value = exception.message;
  }
}
async function importMarkdown(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1000000) throw new Error("文件不能超过 1 MB");
    if (!saveDraft()) return;
    const { parsePost } = await import("../utils/posts");
    const parsed = parsePost(await file.text(), file.name);
    const fresh = createDraft();
    draft.value = {
      ...fresh,
      ...parsed,
      id: fresh.id,
      date: parsed.date || fresh.date,
      tags: parsed.tags.join(", "),
    };
    history.value = [];
    future.value = [];
    error.value = "";
    ElMessage.success("已导入为新草稿");
  } catch (exception) {
    error.value = `导入失败：${exception.message}`;
  } finally {
    event.target.value = "";
  }
}
async function publish() {
  try {
    serializeDraft(draft.value);
    if (!canPublish.value) return;
    saveDraft();
    publishing.value = true;
    error.value = "";
    const response = await fetch("/api/editor/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Hermit-Editor": "1" },
      body: JSON.stringify(draft.value),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "发布失败");
    // 重新载入由 Vite glob 更新的文章集合，确保详情页立即可见。
    window.location.assign(`/post/${result.slug}`);
  } catch (exception) {
    error.value = exception.message;
    publishing.value = false;
  }
}
function onBeforeUnload(event) {
  if (!saveDraft()) {
    event.preventDefault();
    event.returnValue = "";
  }
}
onBeforeRouteLeave(() => {
  if (saveDraft()) return true;
  return window.confirm("草稿尚未保存，离开可能丢失修改。仍要离开吗？");
});
onMounted(async () => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored) {
      if (!Array.isArray(stored.items)) throw new Error("草稿数据格式错误");
      drafts.value = stored.items.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          [
            "title",
            "slug",
            "date",
            "series",
            "category",
            "tags",
            "excerpt",
            "cover",
            "content",
          ].every((key) => typeof item[key] === "string"),
      );
      const restored =
        drafts.value.find((item) => item.id === stored.current) ||
        drafts.value[0];
      if (restored) draft.value = { ...restored };
    }
  } catch {
    error.value = "无法读取已有草稿，请先导出当前内容备份。";
  }
  previewBody.value = draft.value.content;
  window.addEventListener("beforeunload", onBeforeUnload);
  try {
    const response = await fetch("/api/editor/status");
    const result = await response.json();
    if (!stopped) canPublish.value = result.localPublishing === true;
  } catch {
    /* 静态部署无本地发布接口，仍可保存草稿和导出。 */
  }
});
onBeforeUnmount(() => {
  stopped = true;
  saveDraft();
  clearTimeout(previewTimer);
  window.removeEventListener("beforeunload", onBeforeUnload);
});
</script>

<template>
  <div class="container writer-page">
    <header class="writer-heading">
      <div>
        <span class="eyebrow">THE WRITING DESK</span>
        <h1>写博客<span class="accent-dot">.</span></h1>
      </div>
      <div class="writer-actions">
        <button
          class="writer-command"
          title="删除当前草稿"
          aria-label="删除当前草稿"
          @click="deleteDraft"
        >
          <Delete />
        </button>
        <button class="writer-command" @click="newDraft"><Plus /> 新建</button
        ><button class="writer-command" @click="saveDraft">
          <DocumentChecked /> 保存草稿</button
        ><button class="writer-command" @click="download">
          <Download /> 导出 Markdown</button
        ><el-button
          v-if="canPublish"
          type="primary"
          :loading="publishing"
          @click="publish"
          ><Upload /> 发布文章</el-button
        >
      </div>
    </header>
    <div class="writer-status">
      <span aria-live="polite">{{ status }}</span
      ><span>{{
        canPublish
          ? "本地发布 · 写入 posts 目录"
          : "浏览器草稿 · 发布请导出 Markdown"
      }}</span>
    </div>
    <div v-if="error" class="writer-error" role="alert">{{ error }}</div>
    <div class="writer-metadata">
      <label class="writer-title-field"
        >文章标题<input
          v-model="draft.title"
          maxlength="120"
          placeholder="今天，想记录什么？" /></label
      ><label
        >草稿箱<select
          :value="draft.id"
          @change="switchDraft($event.target.value)"
        >
          <option
            v-if="!drafts.some((item) => item.id === draft.id)"
            :value="draft.id"
          >
            新草稿
          </option>
          <option v-for="item in drafts" :key="item.id" :value="item.id">
            {{ item.title || "未命名草稿" }}
          </option>
        </select></label
      ><label
        >文章地址<input
          v-model="draft.slug"
          placeholder="my-learning-note" /></label
      ><label>发布日期<input v-model="draft.date" type="date" /></label
      ><label
        >所属系列<select v-model="draft.series">
          <option value="basics">基础学习</option>
          <option value="campus">智慧三维</option>
          <option value="wukong">悟空旅游</option>
          <option value="notes">技术随笔</option>
        </select></label
      ><label>栏目<input v-model="draft.category" maxlength="50" /></label
      ><label
        >标签<input
          v-model="draft.tags"
          placeholder="Vue 3, JavaScript"
          maxlength="300" /></label
      ><label
        >封面<select v-model="draft.cover">
          <option value="/images/basics-javascript-data.webp">JavaScript 数据结构</option>
          <option value="/images/basics-async-fetch.webp">异步请求流程</option>
          <option value="/images/basics-vue-reactivity.webp">Vue 响应式</option>
          <option value="/images/basics-vue-lifecycle.webp">组件生命周期</option>
          <option value="/images/basics-geojson-crs.webp">GeoJSON 与坐标系</option>
          <option value="/images/basics-python-json.webp">Python 数据处理</option>
          <option value="/images/wukong.webp">取景地地图</option>
          <option value="/images/campus.webp">三维校园</option>
          <option value="/images/campus-path.webp">校园路网</option>
          <option value="/images/campus-tour.webp">三维巡览</option>
          <option value="/images/wukong-buffer.webp">缓冲区分析</option>
        </select></label
      ><label class="writer-summary-field"
        >摘要<textarea
          v-model="draft.excerpt"
          rows="2"
          maxlength="500"
          placeholder="这篇笔记记录了什么问题与收获？"
        ></textarea>
      </label>
    </div>
    <div class="editor-toolbar">
      <div class="format-tools">
        <button
          v-for="tool in tools"
          :key="tool.title"
          :title="tool.title"
          :aria-label="tool.title"
          @click="insert(tool.before, tool.after, tool.fallback)"
        >
          <component v-if="tool.icon" :is="tool.icon" /><span v-else>{{
            tool.text
          }}</span></button
        ><span class="toolbar-divider"></span
        ><button
          :disabled="!history.length"
          title="撤销"
          aria-label="撤销"
          @click="undo"
        >
          <Back /></button
        ><button
          :disabled="!future.length"
          title="重做"
          aria-label="重做"
          @click="redo"
        >
          <Right /></button
        ><button
          title="导入 Markdown"
          aria-label="导入 Markdown"
          @click="importer.click()"
        >
          <Upload /></button
        ><input
          ref="importer"
          class="file-input"
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          @change="importMarkdown"
        />
      </div>
      <div class="editor-modes" role="group" aria-label="编辑模式">
        <button
          v-for="item in [
            { id: 'edit', label: '编辑', icon: EditPen },
            { id: 'split', label: '对照', icon: Reading },
            { id: 'preview', label: '预览', icon: View },
          ]"
          :key="item.id"
          :aria-pressed="mode === item.id"
          :class="{ active: mode === item.id }"
          @click="mode = item.id"
        >
          <component :is="item.icon" />{{ item.label }}
        </button>
      </div>
    </div>
    <div class="editor-workspace" :class="`mode-${mode}`">
      <div v-show="mode !== 'preview'" class="editor-input">
        <div class="editor-pane-label">
          MARKDOWN <span>{{ words }} 字符</span>
        </div>
        <textarea
          ref="textarea"
          :value="draft.content"
          aria-label="Markdown 正文"
          placeholder="## 今天的学习笔记"
          spellcheck="false"
          @input="setContent($event.target.value)"
          @keydown.ctrl.z.prevent="undo"
          @keydown.meta.z.prevent="undo"
          @keydown.ctrl.y.prevent="redo"
          @keydown.tab.prevent="insert('  ')"
        ></textarea>
      </div>
      <section v-show="mode !== 'edit'" class="editor-preview">
        <div class="editor-pane-label">PREVIEW</div>
        <h2>{{ draft.title || "未命名文章" }}</h2>
        <p v-if="draft.excerpt" class="preview-excerpt">{{ draft.excerpt }}</p>
        <div class="markdown-body" v-html="previewHtml"></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.writer-page {
  padding-top: 30px;
}
.writer-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
h1 {
  font-size: 30px;
  margin-top: 6px;
}
.writer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.writer-command {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: white;
}
.writer-command:hover {
  border-color: var(--green);
}
.writer-actions svg {
  width: 16px;
  height: 16px;
  margin-right: 3px;
}
.writer-status {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 11px;
  margin: 18px 0;
}
.writer-error {
  background: #fff0e9;
  color: #a84e32;
  padding: 12px 16px;
  border-left: 3px solid #cb785e;
  margin-bottom: 16px;
}
.writer-metadata {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 20px 0 24px;
  border-block: 1px solid var(--line);
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
  min-width: 0;
}
label input,
label select,
label textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  background: white;
  color: var(--text);
  border-radius: 5px;
  padding: 9px 10px;
  font-size: 13px;
}
.writer-title-field {
  grid-column: span 3;
}
.writer-title-field input {
  font-size: 18px;
}
.writer-summary-field {
  grid-column: span 3;
}
label textarea {
  resize: vertical;
  min-height: 65px;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding: 10px;
  border: 1px solid var(--line);
  background: #edf3ef;
  border-radius: 6px 6px 0 0;
}
.format-tools,
.editor-modes {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}
.format-tools button {
  width: 32px;
  height: 32px;
  padding: 5px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  font-weight: 600;
}
.format-tools button:hover:not(:disabled) {
  background: white;
}
.format-tools button:disabled {
  opacity: 0.3;
  cursor: default;
}
.format-tools svg {
  width: 16px;
  height: 16px;
}
.toolbar-divider {
  height: 19px;
  width: 1px;
  background: var(--line);
  margin: 0 5px;
}
.editor-modes button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 11px;
  border-radius: 4px;
}
.editor-modes button.active {
  background: var(--green);
  color: white;
}
.editor-modes svg {
  width: 14px;
  height: 14px;
}
.file-input {
  display: none;
}
.editor-workspace {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-top: 0;
  border-radius: 0 0 6px 6px;
  min-height: 540px;
  background: white;
}
.editor-workspace.mode-edit,
.editor-workspace.mode-preview {
  grid-template-columns: minmax(0, 1fr);
}
.editor-input,
.editor-preview {
  min-width: 0;
}
.editor-input {
  display: flex;
  flex-direction: column;
}
.editor-pane-label {
  display: flex;
  justify-content: space-between;
  font:
    10px Consolas,
    monospace;
  color: var(--muted);
  padding: 12px 18px;
  border-bottom: 1px solid var(--line);
}
.editor-input > textarea {
  border: 0;
  resize: vertical;
  min-height: 500px;
  flex: 1;
  width: 100%;
  padding: 20px;
  outline-offset: -3px;
  font:
    13px/1.9 Consolas,
    "Microsoft YaHei",
    monospace;
  color: var(--text);
  background: #fcfdfc;
  tab-size: 2;
}
.editor-preview {
  border-left: 1px solid var(--line);
  overflow: auto;
  max-height: 850px;
  padding: 0 22px 24px;
  overflow-wrap: anywhere;
}
.editor-preview > .editor-pane-label {
  margin-inline: -22px;
}
.editor-preview > h2 {
  font-size: 23px;
  margin-top: 22px;
}
.preview-excerpt {
  color: var(--muted);
  font-size: 13px;
  margin: 10px 0;
}
@media (max-width: 900px) {
  .writer-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .writer-metadata {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .writer-title-field,
  .writer-summary-field {
    grid-column: span 2;
  }
}
@media (max-width: 640px) {
  .writer-actions {
    gap: 6px;
  }
  .writer-command {
    font-size: 11px;
  }
  .editor-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .editor-preview {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .editor-input > textarea {
    min-height: 340px;
    font-size: 12px;
  }
  .editor-toolbar {
    gap: 10px;
    padding: 7px;
  }
  .format-tools button {
    width: 28px;
    height: 30px;
  }
  .writer-metadata {
    gap: 12px;
  }
  .writer-status {
    font-size: 10px;
  }
  .editor-preview > h2 {
    font-size: 21px;
  }
}
</style>
