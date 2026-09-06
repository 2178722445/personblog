<script setup>
import { ref } from "vue";
import {
  TopRight,
  Message,
  DocumentCopy,
  Position,
  Reading,
  Connection,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { profile, projects } from "../data/profile";
import ProjectCard from "../components/ProjectCard.vue";
import SkillStack from "../components/SkillStack.vue";
import { useReveal } from "../composables/useReveal";
const root = ref(null);
useReveal(root);
async function copyEmail() {
  try {
    await navigator.clipboard.writeText(profile.email);
    ElMessage.success("邮箱已复制");
  } catch {
    ElMessage.error("复制失败，请手动选择邮箱地址");
  }
}
// 不虚构院校、就读年份或工作履历，以已提供的专业与真实项目组织经历。
const journey = [
  {
    label: "学习起点",
    title: "地理信息科学",
    text: "从地理数据、空间关系与地图表达出发，学习把现实世界转化为可计算、可理解的信息。",
  },
  {
    label: "空间分析实践",
    title: "智慧校园三维系统",
    text: "使用 Python、NetworkX 与 Cesium，把路网分析、等时圈与服务覆盖结果放到三维地图中。",
  },
  {
    label: "WebGIS 实践",
    title: "黑神话：悟空旅游项目",
    text: "围绕山西取景地，探索 Vue 3、OpenLayers、Cesium 和 Turf.js 之间的数据流与交互。",
  },
  {
    label: "继续探索",
    title: "记录问题，也记录答案",
    text: "整理项目代码中的边界条件和设计取舍，让每一次实践都能成为下一次探索的起点。",
  },
];
</script>

<template>
  <div ref="root" class="container about-page">
    <header class="about-intro">
      <img :src="profile.avatar" alt="HERMIT 的头像" width="140" height="140" />
      <div>
        <span class="eyebrow">A LITTLE ABOUT ME</span>
        <h1>我是 HERMIT<span class="accent-dot">.</span></h1>
        <p>{{ profile.introduction }}</p>
        <span class="small-meta"
          ><Position /> 对地理保持好奇，对技术保持热爱</span
        >
      </div>
    </header>
    <div class="about-columns">
      <section data-reveal>
        <div class="section-heading">
          <div>
            <span class="eyebrow">MY JOURNEY</span>
            <h2>在学习中，慢慢构建</h2>
          </div>
        </div>
        <ol class="journey-list">
          <li v-for="(item, index) in journey" :key="item.title">
            <span class="journey-index">0{{ index + 1 }}</span>
            <div>
              <small>{{ item.label }}</small>
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </div>
          </li>
        </ol>
      </section>
      <section class="about-skills" data-reveal>
        <div class="section-heading">
          <div>
            <span class="eyebrow">MY TOOLBOX</span>
            <h2>手边的工具</h2>
          </div>
        </div>
        <SkillStack />
        <div class="focus-note">
          <Connection />
          <p>关注地图可视化、空间数据处理，以及有清晰反馈的交互体验。</p>
        </div>
      </section>
    </div>
    <section id="work" class="section" data-reveal>
      <div class="section-heading">
        <div>
          <span class="eyebrow">PROJECT ARCHIVE</span>
          <h2>从想法到实践</h2>
        </div>
        <Reading />
      </div>
      <div class="projects-grid">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </section>
    <section id="contact" class="contact-section" data-reveal>
      <div>
        <span class="eyebrow">LET'S CONNECT</span>
        <h2>聊聊地图，也聊聊技术。</h2>
        <p>欢迎交流 WebGIS、空间分析与项目实践。</p>
      </div>
      <div class="contact-methods">
        <div class="contact-method">
          <Message />
          <div>
            <small>EMAIL</small
            ><a
              v-if="profile.email.includes('.com')"
              :href="`mailto:${profile.email}`"
              >{{ profile.email }}</a
            ><span v-else>{{ profile.email }}</span>
          </div>
          <button
            class="icon-button"
            title="复制邮箱"
            aria-label="复制邮箱"
            @click="copyEmail"
          >
            <DocumentCopy />
          </button>
        </div>
        <a
          class="contact-method"
          :href="profile.github"
          target="_blank"
          rel="noopener noreferrer"
          ><Connection />
          <div><small>GITHUB</small><span>2178722445</span></div>
          <TopRight
        /></a>
      </div>
    </section>
  </div>
</template>
