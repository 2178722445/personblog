<script setup>
import { ArrowRight, Clock } from "@element-plus/icons-vue";
defineProps({ post: { type: Object, required: true }, compact: Boolean });
</script>

<template>
  <article class="post-card" :class="{ compact }">
    <router-link
      :to="`/post/${post.slug}`"
      class="post-image-link"
      tabindex="-1"
      aria-hidden="true"
      ><img
        :src="post.cover"
        :alt="post.title"
        loading="lazy"
        width="720"
        height="405"
      /><span v-if="post.series !== 'basics'" class="image-label" :class="post.series">{{
        post.category
      }}</span></router-link
    >
    <div class="post-card-body">
      <div class="post-meta">
        <time :datetime="post.date">{{ post.date.replaceAll("-", ".") }}</time
        ><span><Clock /> {{ post.minutes }} 分钟</span>
      </div>
      <h3>
        <router-link :to="`/post/${post.slug}`">{{ post.title }}</router-link>
      </h3>
      <p>{{ post.excerpt }}</p>
      <div class="post-card-footer">
        <div class="tags">
          <router-link
            v-for="tag in post.tags.slice(0, 3)"
            :key="tag"
            :to="{ path: '/blog', query: { tag } }"
            >{{ tag }}</router-link
          >
        </div>
        <router-link
          :to="`/post/${post.slug}`"
          class="read-arrow"
          :aria-label="`阅读：${post.title}`"
          ><ArrowRight
        /></router-link>
      </div>
    </div>
  </article>
</template>
