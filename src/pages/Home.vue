<script setup>
import { computed, ref } from "vue";
import {
  ArrowRight,
  Connection,
  Collection,
  Calendar,
  Position,
} from "@element-plus/icons-vue";
import { posts } from "../utils/posts";
import { projects, profile } from "../data/profile";
import ProjectCard from "../components/ProjectCard.vue";
import PostCard from "../components/PostCard.vue";
import ProfileSidebar from "../components/ProfileSidebar.vue";
import { useReveal } from "../composables/useReveal";
const root = ref(null);
useReveal(root);
const selectedSeries = ref("all");
const latest = computed(() =>
  posts
    .filter(
      (post) =>
        selectedSeries.value === "all" || post.series === selectedSeries.value,
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 4),
);
</script>

<template>
  <div ref="root" class="container home-page">
    <header class="home-intro">
      <div>
        <div class="eyebrow">
          <span class="little-line"></span> A GEOGRAPHER'S FIELD NOTES
        </div>
        <h1>
          HERMIT<span class="accent-dot">.</span>
          <img
            class="mobile-intro-avatar"
            :src="profile.avatar"
            alt="HERMIT 的头像"
            width="52"
            height="52"
          />
          <span class="intro-title">让想法，在地图上发生。</span>
        </h1>
        <p>{{ profile.introduction }}</p>
        <div class="intro-meta">
          <span><Position /> WebGIS 开发</span
          ><span><Connection /> 空间分析</span
          ><span><Collection /> 记录每一次探索</span>
        </div>
      </div>
      <div class="intro-stamp" aria-hidden="true">
        <span>EXPLORING</span><Position /><span>THE WORLD</span>
      </div>
    </header>
    <div class="home-columns">
      <div class="home-main">
        <section id="projects" class="section" data-reveal>
          <div class="section-heading">
            <div>
              <span class="eyebrow">SELECTED PROJECTS</span>
              <h2>把想法变成作品<span class="heading-dot"></span></h2>
            </div>
            <router-link to="/about#work" class="text-link"
              >项目档案 <ArrowRight
            /></router-link>
          </div>
          <div class="projects-grid">
            <ProjectCard
              v-for="project in projects"
              :key="project.id"
              :project="project"
              :count="posts.filter((p) => p.series === project.id).length"
            />
          </div>
        </section>
        <section class="section articles-section" data-reveal>
          <div class="section-heading">
            <div>
              <span class="eyebrow">LATEST WRITING</span>
              <h2>最近，写了这些</h2>
            </div>
            <router-link to="/blog" class="text-link"
              >全部 {{ posts.length }} 篇 <ArrowRight
            /></router-link>
          </div>
          <div class="article-tabs" role="tablist" aria-label="文章系列">
            <button
              v-for="tab in [
                { id: 'all', name: '全部文章' },
                { id: 'basics', name: '基础学习' },
                { id: 'campus', name: '智慧三维' },
                { id: 'wukong', name: '悟空旅游' },
              ]"
              :key="tab.id"
              role="tab"
              :aria-selected="selectedSeries === tab.id"
              :class="{ active: selectedSeries === tab.id }"
              @click="selectedSeries = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>
          <div class="post-grid">
            <PostCard v-for="post in latest" :key="post.slug" :post="post" />
          </div>
        </section>
        <section class="notebook-strip" data-reveal>
          <Calendar />
          <div>
            <span class="eyebrow">LEARNING IN PUBLIC</span>
            <h3>每一个问题，都值得留下一篇笔记。</h3>
            <p>从坐标系到路网，从状态管理到三维渲染，记录实践中的细节。</p>
          </div>
          <router-link
            to="/blog"
            class="icon-button"
            aria-label="前往所有技术笔记"
            ><ArrowRight
          /></router-link>
        </section>
      </div>
      <ProfileSidebar />
    </div>
  </div>
</template>
