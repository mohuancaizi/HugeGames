<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import type { CategoryItem, PublishedGameSummary } from "@arcade/shared";
import PortalLayout from "./PortalLayout.vue";
import { getPortalCategories, getPortalGames, isPortalSort, type PortalSort } from "../../services/portalApi";
import { readFavorites, toggleFavorite } from "../../services/portalStorage";
import { updatePortalMeta } from "./portalMeta";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const games = ref<PublishedGameSummary[]>([]);
const categories = ref<CategoryItem[]>([]);
const total = ref(0);
const favorites = ref<string[]>([]);
const q = ref(typeof route.query.q === "string" ? route.query.q : "");
const category = ref(typeof route.query.category === "string" ? route.query.category : "");
const sort = ref<PortalSort>(isPortalSort(typeof route.query.sort === "string" ? route.query.sort : null) ? route.query.sort as PortalSort : "featured");
const hasFilters = computed(() => Boolean(q.value || category.value || sort.value !== "featured"));

function syncFromRoute(): void {
  q.value = typeof route.query.q === "string" ? route.query.q : "";
  category.value = typeof route.query.category === "string" ? route.query.category : "";
  const routeSort = typeof route.query.sort === "string" ? route.query.sort : null;
  sort.value = isPortalSort(routeSort) ? routeSort : "featured";
}
function syncUrl(): void {
  void router.replace({ query: { ...(q.value.trim() ? { q: q.value.trim().slice(0, 100) } : {}), ...(category.value ? { category: category.value } : {}), ...(sort.value !== "featured" ? { sort: sort.value } : {}) } });
}
async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const result = await getPortalGames({ q: q.value, category: category.value, sort: sort.value, limit: 50 });
    games.value = result.data;
    total.value = result.meta.total;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "目录暂时无法加载";
  } finally {
    loading.value = false;
  }
}
function submit(): void { q.value = q.value.slice(0, 100); syncUrl(); void load(); }
function clearFilters(): void { q.value = ""; category.value = ""; sort.value = "featured"; syncUrl(); void load(); }
function selectCategory(slug: string): void { category.value = category.value === slug ? "" : slug; syncUrl(); void load(); }
function favorite(slug: string): void { favorites.value = toggleFavorite(slug).values; }
function coverStyle(game: PublishedGameSummary): Record<string, string> { return game.cover_url ? { backgroundImage: `url(${game.cover_url})` } : {}; }
function playable(game: PublishedGameSummary): boolean { return game.launch_mode === "same-origin"; }

watch(() => route.query, () => { syncFromRoute(); void load(); });
onMounted(async () => {
  favorites.value = readFavorites().values;
  updatePortalMeta({ title: "发现游戏｜星屿游廊", description: "浏览星屿游廊的原创网页游戏目录。" });
  try { categories.value = (await getPortalCategories()).data; } catch { categories.value = []; }
  syncFromRoute();
  void load();
});
</script>

<template>
  <PortalLayout>
    <div class="portal-container portal-directory">
      <section class="portal-page-heading"><p class="portal-kicker">GAME DIRECTORY</p><h1>发现游戏</h1><p>按关键词、分类和更新时间找到下一款打开即玩的游戏。</p></section>
      <form class="portal-directory-toolbar" role="search" @submit.prevent="submit">
        <label class="portal-search-field"><span aria-hidden="true">⌕</span><input v-model="q" type="search" maxlength="100" placeholder="搜索游戏名称、标签或开发者" /></label>
        <label class="portal-select"><span>排序</span><select v-model="sort" aria-label="排序" @change="submit"><option value="featured">精选</option><option value="popular">热门</option><option value="new">新游</option><option value="updated">最近更新</option></select></label>
        <button class="portal-button portal-button-primary" type="submit">搜索</button>
      </form>
      <div class="portal-filter-row" aria-label="游戏分类筛选">
        <button class="portal-filter-chip" :class="{ active: !category }" type="button" @click="selectCategory('')">全部</button>
        <button v-for="item in categories" :key="item.slug" class="portal-filter-chip" :class="{ active: category === item.slug }" type="button" @click="selectCategory(item.slug)">{{ item.name }}</button>
        <button v-if="hasFilters" class="portal-clear-filter" type="button" @click="clearFilters">清除筛选 ×</button>
      </div>
      <div class="portal-results-meta" aria-live="polite"><span class="portal-results-count"><strong>{{ total }}</strong> 款游戏</span><span v-if="q" class="portal-results-filter">搜索“{{ q }}”</span><span v-if="category" class="portal-results-filter">{{ categories.find((item) => item.slug === category)?.name ?? category }}</span></div>

      <div v-if="loading" class="portal-card-grid portal-dense-grid portal-skeleton-grid" aria-label="加载中"><i v-for="n in 8" :key="n" /></div>
      <section v-else-if="error" class="portal-state" role="alert"><strong>目录加载失败</strong><p>{{ error }}</p><button class="portal-button" type="button" @click="load">重试</button></section>
      <section v-else-if="!games.length" class="portal-state portal-empty-state"><strong>没有找到匹配游戏</strong><p>换个关键词或清除筛选条件试试。</p><button class="portal-button" type="button" @click="clearFilters">清除筛选</button></section>
      <div v-else class="portal-card-grid portal-dense-grid">
        <article v-for="game in games" :key="game.slug" class="portal-card" :style="{ '--accent': game.accent ?? '#55d8bb' }">
          <RouterLink :to="`/zh/game/${game.slug}`">
            <div class="portal-card-art" :style="coverStyle(game)"><span v-if="!game.cover_url" class="portal-art-glyph">{{ game.legacy_icon || game.title.slice(0, 1) }}</span><span class="portal-status" :class="{ playable: playable(game) }">{{ playable(game) ? "可玩" : "接入中" }}</span></div>
            <div class="portal-card-copy"><span class="portal-card-category">{{ game.categories[0]?.name ?? "游戏" }} · {{ game.developer_name }}</span><h2>{{ game.title }}</h2><p>{{ game.short_description }}</p><small>{{ game.tags.slice(0, 3).join(" · ") }} · {{ game.orientation === "portrait" ? "竖屏" : "横屏/自适应" }}</small></div>
          </RouterLink>
          <button class="portal-favorite" type="button" :aria-label="favorites.includes(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="favorites.includes(game.slug)" @click.stop.prevent="favorite(game.slug)">{{ favorites.includes(game.slug) ? "★" : "☆" }}</button>
        </article>
      </div>
    </div>
  </PortalLayout>
</template>
