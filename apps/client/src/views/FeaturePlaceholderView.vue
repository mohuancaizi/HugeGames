<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import BottomNav from "../components/navigation/BottomNav.vue";

const route = useRoute();
const pages: Record<string, { title: string; eyebrow: string; description: string; action: string; path: string }> = {
  "/adventure": { title: "冒险章节", eyebrow: "主线地图", description: "灰烬边境的关卡地图正在整理中，先从首页继续你的主线。", action: "回到首页", path: "/zh" },
  "/cards": { title: "我的卡牌", eyebrow: "卡牌图鉴", description: "查看已收集的英雄、技能与编队配置。详细养成页面即将开放。", action: "回到首页", path: "/zh" },
  "/summon": { title: "星辉召唤", eyebrow: "召唤大厅", description: "召唤池正在准备中，完成更多任务后解锁新的英雄。", action: "查看任务", path: "/tasks" },
  "/tasks": { title: "任务", eyebrow: "每日委托", description: "每日任务列表将在同步后显示，当前已有一项任务等待完成。", action: "去冒险", path: "/adventure" },
  "/more": { title: "更多", eyebrow: "旅途菜单", description: "召唤、挂机收益、设置与帮助都可以从这里进入。", action: "开始探索", path: "/summon" },
};
const page = computed(() => pages[route.path] ?? pages["/more"]);
</script>

<template>
  <div class="rpg-shell placeholder-shell">
    <header class="subpage-topbar"><RouterLink class="back-button" to="/zh" aria-label="返回首页">‹</RouterLink><div><p class="section-label">{{ page.eyebrow }}</p><strong>{{ page.title }}</strong></div><span class="topbar-spacer"></span></header>
    <main class="placeholder-main"><div class="placeholder-art" aria-hidden="true"><img src="/assets/hero/hero-chapter-seal.svg" alt="" /></div><p class="section-label">功能预览</p><h1>{{ page.title }}</h1><p>{{ page.description }}</p><RouterLink class="primary-button" :to="page.path">{{ page.action }} <span>›</span></RouterLink><div class="preview-links"><RouterLink to="/battle-preview">查看战斗美术</RouterLink><RouterLink to="/summon-preview">查看召唤美术</RouterLink></div><div class="placeholder-state"><span class="status-dot"></span> 内容可离线查看 · 写入操作需要联网</div></main>
    <BottomNav />
  </div>
</template>
