import { onMounted, onBeforeUnmount } from "vue";

// 只在进入视口时播放一次；减少动态效果的系统设置优先。
export function useReveal(root) {
  let observer;
  onMounted(() => {
    if (!root.value || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08 },
    );
    root.value.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("will-reveal");
      observer.observe(element);
    });
  });
  onBeforeUnmount(() => observer?.disconnect());
}
