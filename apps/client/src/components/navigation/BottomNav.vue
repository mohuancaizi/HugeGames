<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const items = [
  { label: "首页", path: "/zh", icon: "/assets/icons/icon-nav-home.svg", assetId: "HOME-NAV-001" },
  { label: "冒险", path: "/adventure", icon: "/assets/icons/icon-nav-adventure.svg", assetId: "HOME-NAV-002" },
  { label: "卡牌", path: "/cards", icon: "/assets/icons/icon-nav-cards.svg", assetId: "HOME-NAV-003" },
  { label: "更多", path: "/more", icon: "/assets/icons/icon-nav-more.svg", assetId: "HOME-NAV-004" },
];
const activePath = computed(() => {
  if (route.path.startsWith("/adventure")) return "/adventure";
  if (route.path.startsWith("/cards") || route.path === "/formation") return "/cards";
  if (route.path === "/more" || route.path === "/settings" || route.path.startsWith("/summon") || route.path === "/idle-rewards" || route.path === "/tasks") return "/more";
  return "/zh";
});
</script>

<template>
  <nav class="bottom-nav" aria-label="主导航">
    <RouterLink v-for="item in items" :key="item.path" :to="item.path" class="nav-item" :class="{ active: activePath === item.path }" :aria-current="activePath === item.path ? 'page' : undefined">
      <img :src="item.icon" :data-asset-id="item.assetId" :alt="item.label" /><span>{{ item.label }}</span><i v-if="item.path === '/zh'" class="nav-badge" aria-label="有待处理内容">!</i>
    </RouterLink>
  </nav>
</template>
