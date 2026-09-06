<script setup>
import {
  TopRight,
  Message,
  Location,
  Collection,
} from "@element-plus/icons-vue";
import SkillStack from "./SkillStack.vue";
import { profile, projects } from "../data/profile";
import { posts, allTags } from "../utils/posts";
</script>

<template>
  <aside class="profile-sidebar">
    <section class="profile-block" data-reveal>
      <div class="profile-top">
        <img
          :src="profile.avatar"
          alt="HERMIT 的头像"
          width="72"
          height="72"
        /><span class="status-label"><i></i> 保持好奇，持续学习</span>
      </div>
      <h2>你好，我是 HERMIT<span class="accent-dot">.</span></h2>
      <p>
        地理信息科学专业学生。<br />在代码与地图之间，寻找世界的另一种表达。
      </p>
      <span class="small-meta"><Location /> GIS / 地图可视化</span>
      <div class="profile-stats">
        <div>
          <strong>{{ String(posts.length).padStart(2, "0") }}</strong
          ><span>技术笔记</span>
        </div>
        <div><strong>02</strong><span>项目实践</span></div>
        <div>
          <strong>{{ String(allTags.length).padStart(2, "0") }}</strong
          ><span>探索主题</span>
        </div>
      </div>
      <div class="profile-links">
        <a :href="profile.github" target="_blank" rel="noopener noreferrer"
          >GitHub <TopRight /></a
        ><router-link to="/about#contact"><Message /> 联系我</router-link>
      </div>
    </section>
    <section class="sidebar-section" data-reveal>
      <div class="section-label">
        <h3>常用技术栈</h3>
        <span>SELF ASSESSMENT</span>
      </div>
      <SkillStack />
    </section>
    <section class="sidebar-section" data-reveal>
      <div class="section-label">
        <h3>学习与项目</h3>
        <Collection />
      </div>
      <router-link class="series-link" to="/blog?series=basics"
        ><span class="series-index">00</span
        ><span
          >基础学习笔记<small
            >{{
              posts.filter((p) => p.series === "basics").length
            }}
            篇文章</small
          ></span
        ><TopRight
      /></router-link>
      <router-link
        v-for="project in projects"
        :key="project.id"
        class="series-link"
        :to="{ path: '/blog', query: { series: project.id } }"
        ><span class="series-index">{{ project.number }}</span
        ><span
          >{{ project.shortName }}系列<small
            >{{
              posts.filter((p) => p.series === project.id).length
            }}
            篇文章</small
          ></span
        ><TopRight
      /></router-link>
    </section>
    <section class="sidebar-note" data-reveal>
      <span class="eyebrow">A LITTLE THOUGHT</span>
      <p>地图不只是坐标，<br />也是理解世界的方式。</p>
      <span class="small-meta">记录 · 实践 · 再出发</span>
    </section>
  </aside>
</template>
