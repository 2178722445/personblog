<script setup>
// 熟练度为自评，五格分别对应一星，修改这里即可同步更新展示。
const skills = [
  {
    name: "JavaScript",
    icon: "JS",
    level: 5,
    color: "#a47a20",
    background: "#faf0cd",
  },
  {
    name: "Vue 3",
    icon: "V",
    level: 4,
    color: "#348266",
    background: "#e2f2e8",
  },
  {
    name: "OpenLayers",
    icon: "OL",
    level: 4,
    color: "#3c8190",
    background: "#e4f0f2",
  },
  {
    name: "Cesium",
    icon: "CE",
    level: 3,
    color: "#577fac",
    background: "#e7eef8",
  },
  {
    name: "Python",
    icon: "PY",
    level: 2,
    color: "#956b98",
    background: "#f0e8f3",
  },
];
</script>

<template>
  <div class="skill-stack">
    <div v-for="skill in skills" :key="skill.name" class="skill-row">
      <span
        class="tech-icon"
        :style="{ color: skill.color, background: skill.background }"
        >{{ skill.icon }}</span
      >
      <span class="skill-label">{{ skill.name }}</span>
      <div
        class="skill-meter"
        role="meter"
        :aria-label="skill.name + ' 熟练度'"
        aria-valuemin="0"
        aria-valuemax="5"
        :aria-valuenow="skill.level"
        :title="`${skill.level} / 5`"
      >
        <i
          v-for="n in 5"
          :key="n"
          :class="{ filled: n <= skill.level }"
          :style="{ '--skill-color': skill.color, '--delay': `${n * 80}ms` }"
        ></i>
      </div>
    </div>
  </div>
</template>
