<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import type { CategoryItem, PublishedGameSummary } from "@arcade/shared";
import PortalLayout from "./PortalLayout.vue";
import { getPortalCategories, getPortalGames } from "../../services/portalApi";
import { readFavorites, readRecent, toggleFavorite } from "../../services/portalStorage";
import { updatePortalMeta } from "./portalMeta";

const loading = ref(true);
const error = ref("");
const games = ref<PublishedGameSummary[]>([]);
const categories = ref<CategoryItem[]>([]);
const favorites = ref<string[]>([]);
const recentSlugs = ref<string[]>([]);

const featured = computed(() => games.value.filter((game) => game.featured));
const popular = computed(() => games.value.slice().sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6));
const newGames = computed(() => games.value.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6));
const recent = computed(() => recentSlugs.value.map((slug) => games.value.find((game) => game.slug === slug)).filter((game): game is PublishedGameSummary => Boolean(game)));

function isFavorite(slug: string): boolean { return favorites.value.includes(slug); }
function favorite(slug: string): void { favorites.value = toggleFavorite(slug).values; }
function coverStyle(game: PublishedGameSummary): Record<string, string> {
  return game.cover_url ? { backgroundImage: `url(${game.cover_url})` } : {};
}
function categoryLink(slug: string): string { return `/zh/games?category=${encodeURIComponent(slug)}`; }

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const [catalog, categoryData] = await Promise.all([
      getPortalGames({ limit: 50 }),
      getPortalCategories(),
    ]);
    games.value = catalog.data;
    categories.value = categoryData.data;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "内容暂时无法加载";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  favorites.value = readFavorites().values;
  recentSlugs.value = readRecent().values;
  updatePortalMeta({ title: "星屿游廊｜发现原创网页游戏", description: "无需安装，发现值得打开的原创网页游戏。" });
  void load();
});
</script>

<template>
  <PortalLayout>
    <div class="portal-container portal-home">
      <section class="portal-home-heading">
        <div>
          <p class="portal-kicker">STAR ISLE ARCADE</p>
          <h1>下一局，<em>现在开始</em></h1>
          <p>精选轻量网页游戏，打开即玩，随时发现新的灵感。</p>
        </div>
        <RouterLink class="portal-button portal-button-primary" to="/zh/games">探索全部游戏 <span aria-hidden="true">→</span></RouterLink>
      </section>

      <div v-if="loading" class="portal-home-loading" aria-label="游戏加载中">
        <i v-for="n in 8" :key="n" />
      </div>
      <section v-else-if="error" class="portal-state" role="alert">
        <strong>暂时无法加载游戏</strong><p>{{ error }}</p><button class="portal-button" type="button" @click="load">重新加载</button>
      </section>
      <template v-else>
        <section v-if="featured.length" class="portal-section">
          <div class="portal-section-title"><div><p class="portal-kicker">HANDPICKED</p><h2>精选游戏</h2></div><RouterLink to="/zh/games">查看全部 →</RouterLink></div>
          <div class="portal-featured-row">
            <article v-for="game in featured" :key="game.slug" class="portal-featured-card" :style="{ '--accent': game.accent ?? '#55d8bb' }">
              <RouterLink :to="`/zh/game/${game.slug}`" class="portal-featured-link">
                <div class="portal-featured-art" :style="coverStyle(game)"><span v-if="!game.cover_url" class="portal-art-glyph">{{ game.legacy_icon || game.title.slice(0, 1) }}</span><span class="portal-status" :class="{ playable: game.launch_mode === 'same-origin' }">{{ game.launch_mode === "same-origin" ? "可玩" : "接入中" }}</span></div>
                <div class="portal-card-copy"><span class="portal-card-category">{{ game.categories[0]?.name ?? "游戏" }}</span><h3>{{ game.title }}</h3><p>{{ game.short_description }}</p></div>
              </RouterLink>
              <button class="portal-favorite" type="button" :aria-label="isFavorite(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="isFavorite(game.slug)" @click.stop.prevent="favorite(game.slug)">{{ isFavorite(game.slug) ? "★" : "☆" }}</button>
            </article>
          </div>
        </section>

        <section class="portal-section">
          <div class="portal-section-title"><div><p class="portal-kicker">EXPLORE</p><h2>按分类发现</h2></div><RouterLink to="/zh/games">全部分类 →</RouterLink></div>
          <div class="portal-category-grid">
            <RouterLink v-for="category in categories" :key="category.slug" class="portal-category-card" :to="categoryLink(category.slug)">
              <span class="portal-category-icon" :style="{ '--category-color': `hsl(${category.sort_order * 67 + 150} 68% 63%)` }" aria-hidden="true">✦</span><strong>{{ category.name }}</strong><small>{{ category.description }}</small><span class="portal-category-arrow" aria-hidden="true">↗</span>
            </RouterLink>
          </div>
        </section>

        <section v-if="popular.length" class="portal-section">
          <div class="portal-section-title"><div><p class="portal-kicker">PLAY OFTEN</p><h2>热门游戏</h2></div><RouterLink to="/zh/games?sort=popular">更多热门 →</RouterLink></div>
          <div class="portal-game-row">
            <article v-for="game in popular" :key="game.slug" class="portal-card portal-card-row" :style="{ '--accent': game.accent ?? '#55d8bb' }"><RouterLink :to="`/zh/game/${game.slug}`"><div class="portal-card-art" :style="coverStyle(game)"><span v-if="!game.cover_url">{{ game.legacy_icon || game.title.slice(0, 1) }}</span></div><div class="portal-card-copy"><span class="portal-card-category">{{ game.categories[0]?.name }}</span><h3>{{ game.title }}</h3><p>{{ game.developer_name }}</p></div></RouterLink><button class="portal-favorite" type="button" :aria-label="isFavorite(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="isFavorite(game.slug)" @click.stop.prevent="favorite(game.slug)">{{ isFavorite(game.slug) ? "★" : "☆" }}</button></article>
          </div>
        </section>

        <section v-if="newGames.length" class="portal-section">
          <div class="portal-section-title"><div><p class="portal-kicker">JUST ARRIVED</p><h2>新游上线</h2></div><RouterLink to="/zh/games?sort=new">查看新游 →</RouterLink></div>
          <div class="portal-game-row">
            <article v-for="game in newGames" :key="game.slug" class="portal-card portal-card-row" :style="{ '--accent': game.accent ?? '#55d8bb' }"><RouterLink :to="`/zh/game/${game.slug}`"><div class="portal-card-art" :style="coverStyle(game)"><span v-if="!game.cover_url">{{ game.legacy_icon || game.title.slice(0, 1) }}</span></div><div class="portal-card-copy"><span class="portal-card-category">{{ game.categories[0]?.name }}</span><h3>{{ game.title }}</h3><p>{{ game.developer_name }}</p></div></RouterLink><button class="portal-favorite" type="button" :aria-label="isFavorite(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="isFavorite(game.slug)" @click.stop.prevent="favorite(game.slug)">{{ isFavorite(game.slug) ? "★" : "☆" }}</button></article>
          </div>
        </section>

        <section class="portal-section">
          <div class="portal-section-title"><div><p class="portal-kicker">FULL CATALOG</p><h2>全部游戏 <small>{{ games.length }}</small></h2></div><RouterLink to="/zh/games">打开目录 →</RouterLink></div>
          <div class="portal-card-grid portal-dense-grid">
            <article v-for="game in games" :key="game.slug" class="portal-card" :style="{ '--accent': game.accent ?? '#55d8bb' }"><RouterLink :to="`/zh/game/${game.slug}`"><div class="portal-card-art" :style="coverStyle(game)"><span v-if="!game.cover_url">{{ game.legacy_icon || game.title.slice(0, 1) }}</span><span class="portal-status">{{ game.launch_mode === "same-origin" ? "可玩" : "接入中" }}</span></div><div class="portal-card-copy"><span class="portal-card-category">{{ game.categories[0]?.name }} · {{ game.developer_name }}</span><h3>{{ game.title }}</h3><p>{{ game.short_description }}</p><small>{{ game.tags.slice(0, 3).join(" · ") }}</small></div></RouterLink><button class="portal-favorite" type="button" :aria-label="isFavorite(game.slug) ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="isFavorite(game.slug)" @click.stop.prevent="favorite(game.slug)">{{ isFavorite(game.slug) ? "★" : "☆" }}</button></article>
          </div>
        </section>

        <section class="portal-recent">
          <div><p class="portal-kicker">YOUR SPACE</p><h2>{{ recent.length ? "继续最近玩过的游戏" : "收藏你的下一款游戏" }}</h2><p>{{ recent.length ? `最近打开了 ${recent.length} 款游戏，接着玩吧。` : "点击卡片上的星标，稍后从收藏继续发现。" }}</p></div>
          <RouterLink class="portal-button" to="/zh/favorites">{{ recent.length ? "查看最近玩" : "打开收藏" }} <span aria-hidden="true">→</span></RouterLink>
        </section>
      </template>
    </div>
  </PortalLayout>
</template>
