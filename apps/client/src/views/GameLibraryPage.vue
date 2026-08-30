<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { GAME_CATEGORIES, type GameInfo } from "@arcade/shared";
import { ApiRequestError, getGames } from "../services/api";
import SecondaryButton from "../components/SecondaryButton.vue";

const FAVORITES_KEY = "arcade-game-library-favorites";
const RECENT_KEY = "arcade-game-library-recent";
const PLAYABLE_SLUG = "neon-drift";

type Category = (typeof GAME_CATEGORIES)[number];

const router = useRouter();
const games = ref<GameInfo[]>([]);
const favorites = ref<string[]>([]);
const recentSlugs = ref<string[]>([]);
const searchQuery = ref("");
const selectedCategory = ref<Category>("All");
const favoritesOnly = ref(false);
const loading = ref(true);
const errorMessage = ref("");

const featuredGames = computed(() => games.value.filter((game) => game.featured));
const recentGames = computed(() => recentSlugs.value
  .map((slug) => games.value.find((game) => game.slug === slug))
  .filter((game): game is GameInfo => Boolean(game)));
const filteredGames = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return games.value.filter((game) => {
    const matchesQuery = !query || [game.title, game.description, game.category].some((value) => value.toLowerCase().includes(query));
    const matchesCategory = selectedCategory.value === "All" || game.category === selectedCategory.value;
    const matchesFavorites = !favoritesOnly.value || favorites.value.includes(game.slug);
    return matchesQuery && matchesCategory && matchesFavorites;
  });
});

function readSlugList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveSlugList(key: string, slugs: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    // 本地存储不可用时，当前会话状态仍然有效。
  }
}

function toggleFavorite(slug: string): void {
  favorites.value = favorites.value.includes(slug)
    ? favorites.value.filter((item) => item !== slug)
    : [...favorites.value, slug];
  saveSlugList(FAVORITES_KEY, favorites.value);
}

function rememberRecent(slug: string): void {
  recentSlugs.value = [slug, ...recentSlugs.value.filter((item) => item !== slug)].slice(0, 5);
  saveSlugList(RECENT_KEY, recentSlugs.value);
}

function isPlayable(game: GameInfo): boolean {
  return game.slug === PLAYABLE_SLUG;
}

function openGame(game: GameInfo): void {
  if (!isPlayable(game)) return;
  rememberRecent(game.slug);
  void router.push(`/games/${game.slug}`);
}

async function loadGames(): Promise<void> {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await getGames();
    games.value = response;
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : "游戏列表暂时无法加载，请稍后重试。";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  favorites.value = readSlugList(FAVORITES_KEY);
  recentSlugs.value = readSlugList(RECENT_KEY).slice(0, 5);
  void loadGames();
});
</script>

<template>
  <div class="p0-page game-library-page">
    <header class="game-library-topbar">
      <RouterLink class="back-button" to="/zh" aria-label="返回大厅">‹</RouterLink>
      <div class="topbar-title">
        <p class="section-label">ARCADE HUB</p>
        <strong>游戏库</strong>
      </div>
      <RouterLink class="library-more-link" to="/more">更多</RouterLink>
    </header>

    <main class="p0-content">
      <section class="game-library-heading" aria-labelledby="game-library-title">
        <p class="section-label">探索可玩的世界</p>
        <h1 id="game-library-title">游戏库</h1>
        <p class="muted-copy">收藏喜欢的游戏，随时回到你的下一场冒险。</p>
      </section>

      <section class="game-library-toolbar" aria-label="游戏库筛选">
        <label class="game-search">
          <span aria-hidden="true">⌕</span>
          <span class="sr-only">搜索游戏</span>
          <input v-model="searchQuery" type="search" placeholder="搜索游戏、类型或描述" />
        </label>
        <div class="game-filter-tabs" role="tablist" aria-label="游戏分类">
          <button
            v-for="category in GAME_CATEGORIES"
            :key="category"
            class="game-filter-tab"
            :class="{ active: selectedCategory === category }"
            type="button"
            role="tab"
            :aria-selected="selectedCategory === category"
            @click="selectedCategory = category"
          >
            {{ category === "All" ? "全部" : category }}
          </button>
          <button class="game-filter-tab favorite-tab" :class="{ active: favoritesOnly }" type="button" role="tab" :aria-selected="favoritesOnly" @click="favoritesOnly = !favoritesOnly">
            ♡ 收藏
          </button>
        </div>
      </section>

      <div v-if="loading" class="state-panel game-library-state" role="status" aria-live="polite">
        <span class="loader" aria-hidden="true"></span>
        <strong>正在加载游戏库</strong>
        <p>正在同步最新游戏信息。</p>
      </div>
      <div v-else-if="errorMessage" class="state-panel game-library-state error-state" role="alert">
        <span class="state-icon" aria-hidden="true">!</span>
        <strong>游戏库加载失败</strong>
        <p>{{ errorMessage }}</p>
        <SecondaryButton @click="loadGames">重试</SecondaryButton>
      </div>
      <template v-else>
        <section v-if="featuredGames.length && !searchQuery && selectedCategory === 'All' && !favoritesOnly" class="featured-games" aria-labelledby="featured-title">
          <div class="library-section-heading">
            <div><p class="section-label">本周推荐</p><h2 id="featured-title">精选游戏</h2></div>
            <span>{{ featuredGames.length }} 款</span>
          </div>
          <div class="featured-game-list">
            <article v-for="game in featuredGames" :key="`featured-${game.slug}`" class="featured-game-card" :style="{ '--game-accent': game.accent }">
              <div class="game-art" aria-hidden="true">{{ game.icon }}</div>
              <div class="featured-game-copy"><span class="game-badge">精选 · {{ game.category }}</span><h3>{{ game.title }}</h3><p>{{ game.description }}</p><button class="primary-button" type="button" :disabled="!isPlayable(game)" @click="openGame(game)">{{ isPlayable(game) ? "立即游玩" : "即将推出" }}</button></div>
              <button class="favorite-button" type="button" :aria-label="favorites.includes(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="favorites.includes(game.slug)" @click="toggleFavorite(game.slug)">{{ favorites.includes(game.slug) ? "★" : "☆" }}</button>
            </article>
          </div>
        </section>

        <section v-if="recentGames.length && !searchQuery && selectedCategory === 'All' && !favoritesOnly" class="recent-games" aria-labelledby="recent-title">
          <div class="library-section-heading"><div><p class="section-label">继续旅程</p><h2 id="recent-title">最近游玩</h2></div><span>最多 5 款</span></div>
          <div class="recent-game-list"><button v-for="game in recentGames" :key="`recent-${game.slug}`" class="recent-game-item" type="button" @click="openGame(game)"><span class="recent-game-icon" aria-hidden="true">{{ game.icon }}</span><span><strong>{{ game.title }}</strong><small>{{ isPlayable(game) ? "继续游玩" : "即将推出" }}</small></span></button></div>
        </section>

        <section class="all-games-section" aria-labelledby="all-games-title">
          <div class="library-section-heading"><div><p class="section-label">全部收藏</p><h2 id="all-games-title">{{ favoritesOnly ? "我的收藏" : "所有游戏" }}</h2></div><span>{{ filteredGames.length }} 款</span></div>
          <div v-if="filteredGames.length" class="game-grid">
            <article v-for="game in filteredGames" :key="game.slug" class="game-card" :class="{ playable: isPlayable(game) }" :style="{ '--game-accent': game.accent }">
              <div class="game-card-top"><div class="game-art" aria-hidden="true">{{ game.icon }}</div><button class="favorite-button" type="button" :aria-label="favorites.includes(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="favorites.includes(game.slug)" @click="toggleFavorite(game.slug)">{{ favorites.includes(game.slug) ? "★" : "☆" }}</button></div>
              <span class="game-badge">{{ game.category }}</span>
              <h3>{{ game.title }}</h3>
              <p>{{ game.description }}</p>
              <div class="game-card-meta"><span>{{ game.players }}</span><span v-if="isPlayable(game)" class="available-label">可玩</span><span v-else class="coming-label">Coming soon</span></div>
              <button class="secondary-button game-action" type="button" :disabled="!isPlayable(game)" @click="openGame(game)">{{ isPlayable(game) ? "开始游戏" : "即将推出" }}</button>
            </article>
          </div>
          <div v-else class="state-panel game-library-state empty-state"><span class="state-icon" aria-hidden="true">⌕</span><strong>{{ favoritesOnly ? "还没有收藏游戏" : "没有找到匹配的游戏" }}</strong><p>{{ favoritesOnly ? "点击游戏卡片上的星标，把喜欢的游戏收进来。" : "试试其他关键词或分类。" }}</p><button v-if="favoritesOnly || searchQuery || selectedCategory !== 'All'" class="text-button" type="button" @click="favoritesOnly = false; searchQuery = ''; selectedCategory = 'All'">清除筛选</button></div>
        </section>
      </template>
    </main>
  </div>
</template>
