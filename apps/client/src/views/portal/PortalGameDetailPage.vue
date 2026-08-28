<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import type { GameDetail } from "@arcade/shared";
import PortalLayout from "./PortalLayout.vue";
import { getPortalGame } from "../../services/portalApi";
import { readFavorites, rememberRecent, toggleFavorite } from "../../services/portalStorage";
import { updatePortalMeta } from "./portalMeta";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const game = ref<GameDetail | null>(null);
const favorite = ref(false);

function coverStyle(): Record<string, string> {
  if (!game.value) return {};
  return game.value.cover_url ? { backgroundImage: `url(${game.value.cover_url})` } : { "--accent": game.value.accent ?? "#55d8bb" };
}
function toggle(): void { if (game.value) favorite.value = toggleFavorite(game.value.slug).values.includes(game.value.slug); }
function isPlayable(): boolean { return game.value?.launch_mode === "same-origin"; }
function start(): void {
  if (!game.value || !isPlayable()) return;
  rememberRecent(game.value.slug);
  void router.push(`/games/${game.value.slug}`);
}
function deviceLabel(value: string): string { return ({ desktop: "桌面", mobile: "手机", tablet: "平板", all: "全设备" } as Record<string, string>)[value] ?? value; }
function inputLabel(value: string): string { return ({ keyboard: "键盘", mouse: "鼠标", touch: "触屏", gamepad: "手柄" } as Record<string, string>)[value] ?? value; }
function orientationLabel(value: string): string { return ({ any: "自适应", portrait: "竖屏", landscape: "横屏" } as Record<string, string>)[value] ?? value; }

async function load(): Promise<void> {
  try {
    const result = await getPortalGame(String(route.params.slug));
    game.value = result.data;
    favorite.value = readFavorites().values.includes(result.data.slug);
    updatePortalMeta({ title: `${result.data.title}｜星屿游廊`, description: result.data.short_description });
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "游戏详情暂时无法加载";
  } finally {
    loading.value = false;
  }
}

onMounted(() => { updatePortalMeta({ title: "游戏详情｜星屿游廊", description: "查看网页游戏详情。" }); void load(); });
</script>

<template>
  <PortalLayout>
    <div class="portal-container portal-detail-page">
      <div v-if="loading" class="portal-state"><strong>正在加载详情</strong></div>
      <section v-else-if="error" class="portal-state" role="alert"><strong>无法打开游戏详情</strong><p>{{ error }}</p><RouterLink class="portal-button" to="/zh/games">返回目录</RouterLink></section>
      <article v-else-if="game" class="portal-detail" :style="{ '--accent': game.accent ?? '#55d8bb' }">
        <RouterLink class="portal-back" to="/zh/games">← 返回游戏目录</RouterLink>
        <header class="portal-detail-header">
          <div class="portal-detail-cover" :class="{ 'has-image': Boolean(game.cover_url) }" :style="coverStyle()"><span v-if="!game.cover_url" class="portal-art-glyph">{{ game.legacy_icon || game.title.slice(0, 1) }}</span><span class="portal-status" :class="{ playable: isPlayable() }">{{ isPlayable() ? "可玩" : "接入中" }}</span></div>
          <div class="portal-detail-summary"><p class="portal-kicker">{{ game.categories[0]?.name ?? "游戏" }} · {{ game.status === "published" ? "已发布" : game.status }}</p><h1>{{ game.title }}</h1><p class="portal-detail-description">{{ game.short_description }}</p><div class="portal-tag-list"><span v-for="tag in game.tags" :key="tag">{{ tag }}</span></div><div class="portal-detail-actions"><button class="portal-button portal-button-primary" type="button" :disabled="!isPlayable()" @click="start">{{ isPlayable() ? "开始游戏" : "接入中" }}</button><button class="portal-favorite portal-detail-favorite" type="button" :aria-label="favorite ? `取消收藏 ${game.title}` : `收藏 ${game.title}`" :aria-pressed="favorite" @click="toggle">{{ favorite ? "★" : "☆" }} <span>{{ favorite ? "已收藏" : "收藏" }}</span></button></div></div>
        </header>
        <div class="portal-detail-content"><section><p class="portal-kicker">ABOUT THE GAME</p><h2>关于这款游戏</h2><p>{{ game.long_description || game.short_description }}</p></section><dl class="portal-info-grid"><div><dt>开发者</dt><dd>{{ game.developer_name }}</dd></div><div><dt>玩家</dt><dd>{{ game.players || "单人" }}</dd></div><div><dt>设备</dt><dd>{{ game.device_support?.map(deviceLabel).join(" / ") || "全设备" }}</dd></div><div><dt>输入</dt><dd>{{ game.input_modes.map(inputLabel).join(" / ") || "触屏" }}</dd></div><div><dt>方向</dt><dd>{{ orientationLabel(game.orientation) }}</dd></div><div><dt>语言</dt><dd>{{ game.supported_locales.join(" / ") }}</dd></div></dl></div>
        <p v-if="!isPlayable()" class="portal-unavailable"><strong>暂不可启动</strong><span>当前游戏正在接入中，平台不会伪造外链或嵌入窗口。开放后会在此处提供真实的开始入口。</span></p>
      </article>
    </div>
  </PortalLayout>
</template>
