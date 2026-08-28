<script setup lang="ts">
import PortalSearchBar from "./PortalSearchBar.vue";
</script>
<template>
  <header class="portal-header">
    <RouterLink class="portal-brand" to="/zh"><span class="brand-mark">AH</span><span><strong>星屿游廊</strong><small>原创网页游戏</small></span></RouterLink>
    <nav class="portal-nav" aria-label="主导航"><RouterLink to="/zh/games">游戏大厅</RouterLink><RouterLink to="/zh/category/action">分类</RouterLink><RouterLink to="/zh/favorites">收藏</RouterLink><RouterLink to="/zh/developer">开发者</RouterLink></nav>
    <PortalSearchBar compact />
  </header>
</template>
