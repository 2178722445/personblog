<script setup>
import { TopRight } from "@element-plus/icons-vue";
defineProps({
  project: { type: Object, required: true },
  count: { type: Number, default: 4 },
});
</script>

<template>
  <article class="project-card" :class="project.color">
    <router-link
      :to="{ path: '/blog', query: { series: project.id } }"
      class="project-image"
      :aria-label="`阅读${project.name}专题`"
      ><img
        :src="project.cover"
        :alt="project.name + '项目实际截图'"
        width="800"
        height="450" /><span class="project-number"
        >PROJECT {{ project.number }}</span
      ><span class="project-open"><TopRight /></span
    ></router-link>
    <div class="project-body">
      <div class="project-kicker">
        <span>{{ project.english }}</span
        ><span>{{ String(count).padStart(2, "0") }} 篇手记</span>
      </div>
      <h3>
        <router-link :to="{ path: '/blog', query: { series: project.id } }">{{
          project.name
        }}</router-link>
      </h3>
      <p>{{ project.description }}</p>
      <div class="project-bottom">
        <span>{{ project.tags.join(" / ") }}</span
        ><a
          :href="project.repository"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`查看${project.name}源代码`"
          title="查看源代码"
          ><TopRight
        /></a>
      </div>
    </div>
  </article>
</template>
