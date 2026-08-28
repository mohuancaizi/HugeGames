<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import type { PublishedGameSummary } from "@arcade/shared";
import PortalLayout from "./PortalLayout.vue";
import { getPortalGames } from "../../services/portalApi";
import { readFavorites, readRecent, removeFavorite } from "../../services/portalStorage";
import { updatePortalMeta } from "./portalMeta";

const loading = ref(true);
const error = ref("");
const games = ref<PublishedGameSummary[]>([]);
const favorites = ref<string[]>([]);
const recentSlugs = ref<string[]>([]);
const favoriteGames = computed(() => favorites.value.map((slug) => games.value.find((game) => game.slug === slug)).filter((game): game is PublishedGameSummary => Boolean(game)));
const recentGames = computed(() => recentSlugs.value.map((slug) => games.value.find((game) => game.slug === slug)).filter((game): game is PublishedGameSummary => Boolean(game)));
function remove(slug: string): void { removeFavorite(slug); favorites.value = readFavorites().values; }
function coverStyle(game: PublishedGameSummary): Record<string, string> { return game.cover_url ? { backgroundImage: `url(${game.cover_url})` } : {}; }
async function load(): Promise<void> { try { games.value = (await getPortalGames({ limit: 50 })).data; } catch (cause) { error.value = cause instanceof Error ? cause.message : "列表暂时无法加载"; } finally { loading.value = false; } }
onMounted(() => { favorites.value = readFavorites().values; recentSlugs.value = readRecent().values; updatePortalMeta({ title: "我的收藏与最近玩｜星屿游廊", description: "管理收藏和最近打开的游戏。", robots: "noindex,nofollow" }); void load(); });
</script>

<template>
  <PortalLayout>
    <div class="portal-container portal-favorites-page">
      <section class="portal-page-heading"><p class="portal-kicker">YOUR SPACE</p><h1>我的游戏</h1><p>收藏和最近打开的游戏都保存在当前设备上。</p></section>
      <div v-if="loading" class="portal-card-grid portal-skeleton-grid"><i v-for="n in 4" :key="n" /></div>
      <section v-else-if="error" class="portal-state" role="alert"><strong>列表暂时无法加载</strong><p>{{ error }}</p><button class="portal-button" type="button" @click="load">重试</button></section>
      <template v-else>
        <section class="portal-list-section"><div class="portal-section-title"><div><p class="portal-kicker">SAVED GAMES</p><h2>我的收藏</h2></div><span>{{ favoriteGames.length }} 款</span></div><div v-if="!favoriteGames.length" class="portal-empty"><strong>还没有收藏游戏</strong><span>点击卡片上的星标，稍后从这里继续发现。</span><RouterLink to="/zh/games">去发现游戏 →</RouterLink></div><div v-else class="portal-card-grid portal-dense-grid"><article v-for="game in favoriteGames" :key="game.slug" class="portal-card" :style="{ '--accent': game.accent ?? '#55d8bb' }"><RouterLink :to="`/zh/game/${game.slug}`"><div class="portal-card-art" :style="coverStyle(game)"><span v-if="!game.cover_url">{{ game.legacy_icon || game.title.slice(0, 1) }}</span></div><div class="portal-card-copy"><span class="portal-card-category">{{ game.categories[0]?.name }} · {{ game.developer_name }}</span><h2>{{ game.title }}</h2><p>{{ game.short_description }}</p></div></RouterLink><button class="portal-favorite" type="button" :aria-label="`取消收藏 ${game.title}`" @click.stop.prevent="remove(game.slug)">★</button></article></div></section>
        <section class="portal-list-section"><div class="portal-section-title"><div><p class="portal-kicker">RECENTLY PLAYED</p><h2>最近玩</h2></div><span>{{ recentGames.length }} 款</span></div><div v-if="!recentGames.length" class="portal-empty"><strong>还没有最近玩记录</strong><span>开始一场游戏后，最近打开的内容会显示在这里。</span><RouterLink to="/zh/games">开始一场游戏 →</RouterLink></div><div v-else class="portal-recent-list"><RouterLink v-for="game in recentGames" :key="game.slug" :to="`/zh/game/${game.slug}`"><span class="portal-recent-icon" :style="{ '--accent': game.accent ?? '#55d8bb' }">{{ game.legacy_icon || game.title.slice(0, 1) }}</span><span><strong>{{ game.title }}</strong><small>{{ game.categories[0]?.name }} · {{ game.developer_name }}</small></span><span aria-hidden="true">→</span></RouterLink></div></section>
      </template>
    </div>
  </PortalLayout>
</template>
