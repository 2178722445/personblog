<script setup>
import { ref, watch, nextTick, onBeforeUnmount, h, render } from "vue";
import { DocumentCopy, Check } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
const props = defineProps({ html: { type: String, required: true } });
const root = ref(null);
const emit = defineEmits(["image"]);
let controls = [];
const timers = new Set();
function cleanup() {
  controls.forEach((node) => render(null, node));
  controls = [];
  timers.forEach(clearTimeout);
  timers.clear();
}
// 高亮 HTML 内的复制按钮依然使用现有图标库，并在卸载时回收。
async function enhance() {
  await nextTick();
  root.value?.querySelectorAll(".code-block").forEach((block) => {
    const target = block.querySelector(".code-action");
    const code = block.querySelector("code").textContent;
    const draw = (copied) =>
      render(
        h(
          "button",
          {
            type: "button",
            title: copied ? "已复制" : "复制代码",
            "aria-label": copied ? "已复制" : "复制代码",
            class: "copy-code",
            onClick: async () => {
              try {
                await navigator.clipboard.writeText(code);
                draw(true);
                const timer = setTimeout(() => {
                  draw(false);
                  timers.delete(timer);
                }, 1800);
                timers.add(timer);
              } catch {
                ElMessage.error("复制失败，请选中代码手动复制");
              }
            },
          },
          [h(copied ? Check : DocumentCopy)],
        ),
        target,
      );
    draw(false);
    controls.push(target);
  });
  root.value?.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `放大图片：${img.alt}`);
    img.onclick = () => emit("image", { src: img.src, alt: img.alt });
    img.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        img.click();
      }
    };
  });
}
// 根元素挂载后增强一次。文章路由以 path 为 key，换篇时组件会重新创建。
watch(root, (value) => {
  if (value) enhance();
});
watch(
  () => props.html,
  () => {
    cleanup();
    enhance();
  },
);
onBeforeUnmount(cleanup);
</script>

<template><div ref="root" class="markdown-body" v-html="html"></div></template>
