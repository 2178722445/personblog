<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  House,
  Reading,
  Grid,
  User,
  Message,
  Search,
  Top,
  Position,
  TopRight,
  EditPen,
} from "@element-plus/icons-vue";
import { profile } from "./data/profile";
const route = useRoute();
const router = useRouter();
const scrolled = ref(false);
const progress = ref(0);
const query = ref("");
function updateScroll() {
  scrolled.value = window.scrollY > 240;
  const height = document.documentElement.scrollHeight - innerHeight;
  progress.value =
    height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0;
}
function search() {
  router.push({
    path: "/blog",
    query: query.value.trim() ? { q: query.value.trim() } : {},
  });
}
function backToTop() {
  window.scrollTo({
    top: 0,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
watch(
  () => route.fullPath,
  () => {
    query.value = String(route.query.q || "");
  },
);
onMounted(() =>
  window.addEventListener("scroll", updateScroll, { passive: true }),
);
onBeforeUnmount(() => window.removeEventListener("scroll", updateScroll));
</script>

<template>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <div class="reading-progress" :style="{ width: progress + '%' }"></div>
  <aside class="nav-rail" aria-label="快捷导航">
    <router-link to="/" class="rail-logo" aria-label="HERMIT 首页"
      ><Position
    /></router-link>
    <div class="rail-main">
      <el-tooltip content="写博客" placement="right"
        ><router-link to="/write" class="rail-link" aria-label="写博客"
          ><EditPen /></router-link
      ></el-tooltip>
      <el-tooltip content="首页" placement="right"
        ><router-link to="/" class="rail-link" aria-label="首页"
          ><House /></router-link
      ></el-tooltip>
      <el-tooltip content="技术文章" placement="right"
        ><router-link to="/blog" class="rail-link" aria-label="技术文章"
          ><Reading /></router-link
      ></el-tooltip>
      <el-tooltip content="项目专题" placement="right"
        ><router-link
          to="/#projects"
          class="rail-link rail-anchor"
          aria-label="项目专题"
          ><Grid /></router-link
      ></el-tooltip>
      <el-tooltip content="关于我" placement="right"
        ><router-link to="/about" class="rail-link" aria-label="关于我"
          ><User /></router-link
      ></el-tooltip>
    </div>
    <el-tooltip content="联系我" placement="right"
      ><router-link
        to="/about#contact"
        class="rail-link rail-contact"
        aria-label="联系我"
        ><Message /></router-link
    ></el-tooltip>
    <span class="rail-caption">HERMIT / NOTES</span>
  </aside>
  <div class="page-shell">
    <header class="site-header">
      <div class="header-inner container">
        <router-link to="/" class="brand"
          >HERMIT<span class="accent-dot">.</span
          ><span class="brand-divider"></span
          ><small>地图之外</small></router-link
        >
        <nav class="top-nav" aria-label="主导航">
          <router-link to="/">首页</router-link
          ><router-link to="/blog">博客</router-link
          ><router-link to="/about">关于我</router-link>
        </nav>
        <form class="header-search" role="search" @submit.prevent="search">
          <input
            v-model="query"
            placeholder="搜索文章..."
            aria-label="搜索文章"
          /><button type="submit" aria-label="执行搜索" title="搜索文章">
            <Search />
          </button>
        </form>
        <router-link
          to="/blog"
          class="mobile-search icon-button"
          aria-label="搜索文章"
          ><Search
        /></router-link>
      </div>
    </header>
    <main id="main-content" class="main-area">
      <router-view v-slot="{ Component }"
        ><Transition name="page" mode="out-in"
          ><component :is="Component" :key="route.path" /></Transition
      ></router-view>
    </main>
    <footer class="site-footer container">
      <div>
        <router-link to="/" class="footer-brand"
          >HERMIT<span class="accent-dot">.</span></router-link
        >
        <p>在地图上探索，在代码中生长。</p>
      </div>
      <div class="footer-right">
        <div>
          <a :href="profile.github" target="_blank" rel="noopener noreferrer"
            >GitHub <TopRight /></a
          ><router-link to="/about#contact">联系我 <TopRight /></router-link>
        </div>
        <small
          >© {{ new Date().getFullYear() }} HERMIT · 地图之外，记录所想</small
        >
      </div>
    </footer>
  </div>
  <Transition name="fade"
    ><button
      v-if="scrolled"
      class="back-top icon-button"
      title="回到顶部"
      aria-label="回到顶部"
      @click="backToTop"
    >
      <Top /></button
  ></Transition>
</template>
