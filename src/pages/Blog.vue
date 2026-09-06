<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Search,
  Grid,
  Operation,
  ArrowRight,
  EditPen,
} from "@element-plus/icons-vue";
import { posts, allTags } from "../utils/posts";
import { projects } from "../data/profile";
import PostCard from "../components/PostCard.vue";
import ProfileSidebar from "../components/ProfileSidebar.vue";
const route = useRoute();
const router = useRouter();
const query = ref(String(route.query.q || ""));
const series = computed(() => String(route.query.series || "all"));
const tag = computed(() => String(route.query.tag || ""));
const sortMode = ref("desc");
const view = ref("grid");
const currentProject = computed(() =>
  projects.find((project) => project.id === series.value),
);
watch(
  () => route.query.q,
  (value) => {
    query.value = String(value || "");
  },
);
function setFilter(key, value) {
  router.replace({
    path: "/blog",
    query: { ...route.query, [key]: value || undefined },
  });
}
const filteredPosts = computed(() => {
  const search = String(route.query.q || "")
    .trim()
    .toLowerCase();
  return posts
    .filter(
      (post) =>
        (series.value === "all" || post.series === series.value) &&
        (!tag.value || post.tags.includes(tag.value)) &&
        (!search ||
          `${post.title} ${post.excerpt} ${post.tags.join(" ")} ${post.content}`
            .toLowerCase()
            .includes(search)),
    )
    .sort((a, b) =>
      sortMode.value === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
});
function reset() {
  query.value = "";
  router.replace("/blog");
}
</script>

<template>
  <div class="container listing-page">
    <header class="page-heading">
      <span class="eyebrow">THE NOTEBOOK</span>
      <h1>
        {{
          series === "basics"
            ? "基础学习笔记"
            : currentProject
              ? currentProject.shortName + "手记"
              : "技术文章"
        }}<span class="accent-dot">.</span>
      </h1>
      <p>
        {{
          currentProject
            ? currentProject.description
            : "把踩过的坑、想明白的问题，和地图上的发现，一起记下来。"
        }}
      </p>
      <router-link to="/write" class="button-primary write-entry"
        ><EditPen /> 写博客</router-link
      >
    </header>
    <div class="home-columns">
      <div>
        <div class="blog-toolbar">
          <form
            role="search"
            class="blog-search"
            @submit.prevent="setFilter('q', query.trim())"
          >
            <Search /><input
              v-model="query"
              aria-label="搜索笔记"
              placeholder="搜索标题、技术或问题..."
            /><button type="submit" aria-label="查找文章" title="查找文章">
              <ArrowRight />
            </button>
          </form>
          <el-select
            v-model="sortMode"
            aria-label="文章排序"
            class="sort-select"
            ><el-option label="最新发布" value="desc" /><el-option
              label="最早发布"
              value="asc"
          /></el-select>
          <div class="view-switch" role="group" aria-label="文章展示方式">
            <button
              :class="{ active: view === 'grid' }"
              :aria-pressed="view === 'grid'"
              title="网格视图"
              aria-label="网格视图"
              @click="view = 'grid'"
            >
              <Grid /></button
            ><button
              :class="{ active: view === 'list' }"
              :aria-pressed="view === 'list'"
              title="列表视图"
              aria-label="列表视图"
              @click="view = 'list'"
            >
              <Operation />
            </button>
          </div>
        </div>
        <div class="article-tabs" role="tablist" aria-label="项目筛选">
          <button
            v-for="item in [
              { id: 'all', name: '全部文章' },
              { id: 'basics', name: '基础学习' },
              ...projects.map((p) => ({ id: p.id, name: p.shortName })),
            ]"
            :key="item.id"
            role="tab"
            :aria-selected="series === item.id"
            :class="{ active: series === item.id }"
            @click="setFilter('series', item.id === 'all' ? '' : item.id)"
          >
            {{ item.name }}
            <small>{{
              posts.filter((p) => item.id === "all" || p.series === item.id)
                .length
            }}</small>
          </button>
        </div>
        <div class="filter-tags">
          <button :class="{ active: !tag }" @click="setFilter('tag', '')">
            全部标签</button
          ><button
            v-for="item in allTags"
            :key="item"
            :class="{ active: tag === item }"
            :aria-pressed="tag === item"
            @click="setFilter('tag', tag === item ? '' : item)"
          >
            {{ item }}
          </button>
        </div>
        <div class="result-count" aria-live="polite">
          {{ filteredPosts.length }} 篇笔记<span v-if="route.query.q">
            · “{{ route.query.q }}”</span
          ><button
            v-if="tag || series !== 'all' || route.query.q"
            @click="reset"
          >
            重置筛选
          </button>
        </div>
        <div
          v-if="filteredPosts.length"
          class="post-grid"
          :class="{ 'list-view': view === 'list' }"
        >
          <PostCard
            v-for="post in filteredPosts"
            :key="post.slug"
            :post="post"
            :compact="view === 'list'"
          />
        </div>
        <div v-else class="empty-state">
          <Search />
          <h2>暂时没有找到这篇笔记</h2>
          <p>换一个关键词，或回到全部文章。</p>
          <el-button @click="reset">查看全部文章</el-button>
        </div>
      </div>
      <ProfileSidebar />
    </div>
  </div>
</template>
