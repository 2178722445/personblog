import { createRouter, createWebHistory } from "vue-router";

const Home = () => import("../pages/Home.vue");
const Blog = () => import("../pages/Blog.vue");
const Post = () => import("../pages/Post.vue");
const About = () => import("../pages/About.vue");

const routes = [
  { path: "/", name: "home", component: Home },
  { path: "/blog", name: "blog", component: Blog },
  { path: "/post/:slug", name: "post", component: Post },
  { path: "/about", name: "about", component: About },
  {
    path: "/write",
    name: "write",
    component: () => import("../pages/Write.vue"),
  },
  { path: "/:pathMatch(.*)*", name: "not-found", component: Post },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash)
      return new Promise((resolve) =>
        setTimeout(() => {
          const target = document.getElementById(
            decodeURIComponent(to.hash.slice(1)),
          );
          if (!target || router.currentRoute.value.fullPath !== to.fullPath)
            return resolve(false);
          resolve({
            el: target,
            top: 96,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
        }, 250),
      );
    if (to.path === from.path) return false;
    return { top: 0 };
  },
});

router.afterEach(async (to) => {
  const titles = {
    home: "首页",
    blog: "技术文章",
    about: "关于我",
    write: "写博客",
    post: "技术手记",
    "not-found": "页面未找到",
  };
  document.title = `${titles[to.name] || "笔记"} · HERMIT 地图之外`;
  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute(
    "content",
    "HERMIT 的个人技术博客，记录地图可视化、Vue 和地理信息开发。",
  );
  if (to.name === "post") {
    const { getPostBySlug } = await import("../utils/posts");
    const post = getPostBySlug(to.params.slug);
    if (router.currentRoute.value.fullPath !== to.fullPath) return;
    document.title = `${post?.title || "文章未找到"} · HERMIT`;
    if (post) description?.setAttribute("content", post.excerpt);
  }
});

export default router;
