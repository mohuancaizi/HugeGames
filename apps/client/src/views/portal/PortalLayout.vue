<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import type { CategoryItem } from "@arcade/shared";
import { getPortalCategories } from "../../services/portalApi";

const route = useRoute();
const router = useRouter();
const categories = ref<CategoryItem[]>([]);
const search = ref(typeof route.query.q === "string" ? route.query.q : "");

const navigation = [
  { label: "首页", to: "/zh" },
  { label: "发现", to: "/zh/games" },
  { label: "热门", to: "/zh/games?sort=popular" },
  { label: "新游", to: "/zh/games?sort=new" },
  { label: "收藏", to: "/zh/favorites" },
];

function submitSearch(): void {
  const q = search.value.trim().slice(0, 100);
  void router.push({ path: "/zh/games", query: q ? { q } : {} });
}

function categoryPath(slug: string): string {
  return `/zh/games?category=${encodeURIComponent(slug)}`;
}

onMounted(async () => {
  try {
    categories.value = (await getPortalCategories()).data;
  } catch {
    categories.value = [];
  }
});
</script>

<template>
  <div class="portal-layout">
    <header class="portal-header">
      <div class="portal-header-inner">
        <RouterLink class="portal-brand" to="/zh" aria-label="星屿游廊首页">
          <span class="portal-brand-mark" aria-hidden="true">✦</span>
          <span><strong>星屿游廊</strong><small>原创网页游戏</small></span>
        </RouterLink>
        <form class="portal-header-search" role="search" @submit.prevent="submitSearch">
          <label>
            <span class="portal-search-icon" aria-hidden="true">⌕</span>
            <input v-model="search" type="search" maxlength="100" placeholder="搜索游戏、标签或开发者" aria-label="搜索游戏、标签或开发者" />
          </label>
          <button type="submit" aria-label="搜索">搜索</button>
        </form>
        <nav class="portal-header-nav" aria-label="门户导航">
          <RouterLink v-for="item in navigation" :key="item.label" :to="item.to">{{ item.label }}</RouterLink>
        </nav>
      </div>
    </header>

    <div class="portal-mobile-categories" aria-label="游戏分类">
      <RouterLink class="portal-category-pill" to="/zh/games">全部游戏</RouterLink>
      <RouterLink v-for="category in categories" :key="category.slug" class="portal-category-pill" :to="categoryPath(category.slug)">{{ category.name }}</RouterLink>
    </div>

    <div class="portal-shell">
      <aside class="portal-sidebar" aria-label="游戏导航">
        <div class="portal-sidebar-group">
          <p class="portal-sidebar-label">浏览</p>
          <RouterLink to="/zh/games">全部游戏 <span>⌘</span></RouterLink>
          <RouterLink to="/zh/games?sort=popular">热门游戏</RouterLink>
          <RouterLink to="/zh/games?sort=new">新游上线</RouterLink>
          <RouterLink to="/zh/favorites">我的收藏</RouterLink>
        </div>
        <div class="portal-sidebar-group">
          <p class="portal-sidebar-label">分类</p>
          <RouterLink v-for="category in categories" :key="category.slug" :to="categoryPath(category.slug)">
            <i :style="{ '--category-color': `hsl(${category.sort_order * 67 + 150} 68% 63%)` }" aria-hidden="true" />{{ category.name }}
          </RouterLink>
          <span v-if="!categories.length" class="portal-sidebar-loading">分类加载中</span>
        </div>
      </aside>
      <main class="portal-main"><slot /></main>
    </div>

    <footer class="portal-footer">
      <span>星屿游廊 · 原创网页游戏</span>
      <span>游客也可以收藏和开始体验</span>
    </footer>
    <nav class="portal-bottom-nav" aria-label="移动端门户导航">
      <RouterLink to="/zh"><span aria-hidden="true">⌂</span>首页</RouterLink>
      <RouterLink to="/zh/games"><span aria-hidden="true">▦</span>发现</RouterLink>
      <RouterLink to="/zh/games?sort=popular"><span aria-hidden="true">↗</span>热门</RouterLink>
      <RouterLink to="/zh/favorites"><span aria-hidden="true">☆</span>收藏</RouterLink>
    </nav>
  </div>
</template>
