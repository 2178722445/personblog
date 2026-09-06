<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Link,
  Reading,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { posts, getPostBySlug } from "../utils/posts";
import { renderMarkdown } from "../utils/markdown";
import { profile, projects } from "../data/profile";
import MarkdownContent from "../components/MarkdownContent.vue";
const route = useRoute();
const post = computed(() => getPostBySlug(route.params.slug));
const compiled = computed(() => renderMarkdown(post.value?.content || ""));
const project = computed(
  () =>
    projects.find((p) => p.id === post.value?.series) ||
    (post.value?.series === "basics"
      ? {
          id: "basics",
          shortName: "基础学习",
          english: "LEARNING BASICS",
          description:
            "从 JavaScript、Vue 到空间数据，记录学习中的基础知识与实践。",
        }
      : null),
);
const index = computed(() =>
  posts.findIndex((p) => p.slug === route.params.slug),
);
const previous = computed(() => posts[index.value + 1]);
const next = computed(() => posts[index.value - 1]);
const activeHeading = ref("");
const image = ref(null);
const imageOpen = ref(false);
function openImage(value) {
  image.value = value;
  imageOpen.value = true;
}
async function share() {
  try {
    await navigator.clipboard.writeText(location.href);
    ElMessage.success("文章链接已复制");
  } catch {
    ElMessage.error("复制失败，请复制浏览器地址栏中的链接");
  }
}
function updateHeading() {
  const headings = [
    ...document.querySelectorAll(
      ".markdown-body h1, .markdown-body h2, .markdown-body h3",
    ),
  ];
  activeHeading.value =
    (
      headings.filter((h) => h.getBoundingClientRect().top < 180).pop() ||
      headings[0]
    )?.id || "";
}
onMounted(async () => {
  await nextTick();
  updateHeading();
  window.addEventListener("scroll", updateHeading, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", updateHeading));
</script>

<template>
  <div v-if="post" class="container post-page">
    <nav class="breadcrumbs">
      <router-link to="/blog"><ArrowLeft /> 全部文章</router-link><span>/</span
      ><router-link :to="{ path: '/blog', query: { series: post.series } }">{{
        project?.shortName || "技术随笔"
      }}</router-link>
    </nav>
    <div class="reading-layout">
      <article class="article-content">
        <header class="article-heading">
          <span class="eyebrow"
            >{{ project?.english || "FIELD NOTES" }} / {{ post.category }}</span
          >
          <h1>{{ post.title }}</h1>
          <p class="article-excerpt">{{ post.excerpt }}</p>
          <div class="article-byline">
            <img
              :src="profile.avatar"
              alt="HERMIT"
              width="34"
              height="34"
            /><strong>HERMIT</strong
            ><time :datetime="post.date">{{
              post.date.replaceAll("-", ".")
            }}</time
            ><span><Clock /> {{ post.minutes }} 分钟阅读</span
            ><button
              class="icon-button"
              title="复制文章链接"
              aria-label="复制文章链接"
              @click="share"
            >
              <Link />
            </button>
          </div>
          <div class="tags">
            <router-link
              v-for="tag in post.tags"
              :key="tag"
              :to="{ path: '/blog', query: { tag } }"
              >{{ tag }}</router-link
            >
          </div>
        </header>
        <details class="mobile-toc">
          <summary><Reading /> 文章目录</summary>
          <nav aria-label="移动端文章目录">
            <a
              v-for="heading in compiled.headings.filter((h) => h.depth <= 3)"
              :key="heading.id"
              :href="`#${heading.id}`"
              >{{ heading.text }}</a
            >
          </nav>
        </details>
        <button
          class="article-cover-button"
          aria-label="放大项目截图"
          @click="openImage({ src: post.cover, alt: post.title })"
        >
          <img
            class="article-cover"
            :src="post.cover"
            :alt="post.title + '项目截图'"
            width="1440"
            height="810"
          /></button
        ><MarkdownContent :html="compiled.html" @image="openImage" />
        <div class="article-end">
          <span>END OF NOTE</span>
          <p>把问题想明白，再把它记下来。</p>
          <a :href="profile.github" target="_blank" rel="noopener noreferrer"
            >HERMIT / GitHub <ArrowRight
          /></a>
        </div>
        <nav class="post-nav" aria-label="上一篇和下一篇">
          <router-link v-if="previous" :to="`/post/${previous.slug}`"
            ><span><ArrowLeft /> 上一篇</span
            ><strong>{{ previous.title }}</strong></router-link
          ><router-link v-if="next" :to="`/post/${next.slug}`"
            ><span>下一篇 <ArrowRight /></span
            ><strong>{{ next.title }}</strong></router-link
          >
        </nav>
      </article>
      <aside class="toc-sidebar">
        <div class="toc-inner">
          <span class="eyebrow">ON THIS PAGE</span>
          <h2><Reading /> 文章目录</h2>
          <nav aria-label="文章目录">
            <a
              v-for="heading in compiled.headings.filter((h) => h.depth <= 3)"
              :key="heading.id"
              :href="`#${heading.id}`"
              :class="{
                active: activeHeading === heading.id,
                nested: heading.depth === 3,
              }"
              :aria-current="
                activeHeading === heading.id ? 'location' : undefined
              "
              >{{ heading.text }}</a
            >
          </nav>
          <div v-if="project" class="toc-project">
            <span class="eyebrow">PROJECT SERIES</span>
            <h3>{{ project.shortName }}手记</h3>
            <p>{{ project.description }}</p>
            <router-link :to="{ path: '/blog', query: { series: project.id } }"
              >查看整个系列 <ArrowRight
            /></router-link>
          </div>
        </div>
      </aside>
    </div>
    <el-dialog
      v-model="imageOpen"
      :title="image?.alt || '项目截图'"
      width="min(1200px, 94vw)"
      class="image-dialog"
      align-center
      ><img v-if="image" :src="image.src" :alt="image.alt"
    /></el-dialog>
  </div>
  <div v-else class="container empty-state">
    <Reading />
    <h1>这篇笔记还没有写到</h1>
    <p>文章可能已移动，去笔记本里看看。</p>
    <router-link to="/blog" class="button-primary"
      >返回文章列表 <ArrowRight
    /></router-link>
  </div>
</template>
