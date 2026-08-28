<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import PortalLayout from "./portal/PortalLayout.vue";
import { crazyGamesHotMetadata, crazyGamesHotSource, type CrazyGamesHotMetadata } from "../data/crazygamesHotMetadata";
import { updatePortalMeta } from "./portal/portalMeta";

const searchQuery = ref("");
const selectedCategory = ref("");

const categories = computed(() => {
  const values = new Set(crazyGamesHotMetadata.map((game) => game.category?.trim()).filter((category): category is string => Boolean(category)));
  return [...values].sort((a, b) => a.localeCompare(b));
});

const filteredGames = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return crazyGamesHotMetadata.filter((game) => {
    const matchesQuery = !query || [game.game_title, game.game_slug, game.source_platform].some((value) => value.toLocaleLowerCase().includes(query));
    const category = game.category?.trim() || "待补充分类";
    const matchesCategory = !selectedCategory.value || category === selectedCategory.value;
    return matchesQuery && matchesCategory;
  });
});

function categoryLabel(game: CrazyGamesHotMetadata): string {
  return game.category?.trim() || "待补充分类";
}

function categoryClass(game: CrazyGamesHotMetadata): string {
  return game.category?.trim() ? "has-category" : "pending-category";
}

function licenseLabel(status: string): string {
  return status === "unknown" ? "授权待确认" : status;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

onMounted(() => {
  updatePortalMeta({
    title: "CrazyGames 热门元数据预览｜星屿游廊",
    description: "仅供本地查看的 CrazyGames 热门游戏公开元数据预览，不代表获得授权。",
    robots: "noindex,nofollow",
  });
});
</script>

<template>
  <PortalLayout>
    <div class="crazy-metadata-page">
      <header class="crazy-hero">
        <div class="crazy-hero-copy">
          <RouterLink class="crazy-back" to="/zh">返回星屿游廊首页</RouterLink>
          <p class="crazy-eyebrow">PUBLIC METADATA / LOCAL PREVIEW</p>
          <h1>CrazyGames<br /><em>热门元数据</em>预览</h1>
          <p class="crazy-intro">把公开目录整理成一份可检索的本地预览。这里展示的是名称、标识与来源信息，不加载游戏内容。</p>
        </div>
        <div class="crazy-hero-stamp" aria-hidden="true">
          <span>CG</span>
          <strong>HOT<br />40</strong>
          <i />
        </div>
      </header>

      <section class="crazy-notice" aria-label="授权说明">
        <span class="crazy-notice-mark" aria-hidden="true">!</span>
        <div>
          <strong>仅元数据预览，不代表授权</strong>
          <p>当前数据仅来自公开页面元数据；未下载或复制图片、游戏包、脚本、iframe 及其他运行资源。所有授权状态仍待确认。</p>
        </div>
      </section>

      <section class="crazy-stats" aria-label="数据统计摘要">
        <div><strong>{{ crazyGamesHotMetadata.length }}</strong><span>条热门记录</span></div>
        <div><strong>{{ crazyGamesHotMetadata.filter((game) => game.license_status === "unknown").length }}</strong><span>授权待确认</span></div>
        <div><strong>0</strong><span>已下载资源</span></div>
        <div><strong>LOCAL</strong><span>本地静态数据</span></div>
      </section>

      <section class="crazy-directory" aria-labelledby="directory-title">
        <div class="crazy-section-heading">
          <div>
            <p class="crazy-eyebrow">METADATA INDEX</p>
            <h2 id="directory-title">热门记录目录 <small>{{ filteredGames.length }} / {{ crazyGamesHotMetadata.length }}</small></h2>
          </div>
          <span class="crazy-section-note">只查看，不启动游戏</span>
        </div>

        <div class="crazy-toolbar">
          <label class="crazy-search">
            <span aria-hidden="true">⌕</span>
            <input v-model="searchQuery" type="search" maxlength="100" placeholder="搜索游戏名、slug 或平台" />
          </label>
          <button v-if="searchQuery || selectedCategory" class="crazy-reset" type="button" @click="searchQuery = ''; selectedCategory = ''">清除筛选</button>
        </div>

        <div class="crazy-filters" aria-label="分类筛选">
          <button class="crazy-filter" :class="{ active: !selectedCategory }" type="button" @click="selectedCategory = ''">全部</button>
          <button class="crazy-filter" :class="{ active: selectedCategory === '待补充分类' }" type="button" @click="selectedCategory = '待补充分类'">待补充分类</button>
          <button v-for="category in categories" :key="category" class="crazy-filter" :class="{ active: selectedCategory === category }" type="button" @click="selectedCategory = category">{{ category }}</button>
        </div>

        <div v-if="filteredGames.length" class="crazy-grid">
          <article v-for="(game, index) in filteredGames" :key="game.game_slug" class="crazy-card" :class="categoryClass(game)">
            <div class="crazy-card-art" :style="{ '--card-index': index + 1 }">
              <span class="crazy-card-number">{{ String(crazyGamesHotMetadata.indexOf(game) + 1).padStart(2, "0") }}</span>
              <span class="crazy-card-glyph" aria-hidden="true">{{ game.game_title.slice(0, 1) }}</span>
              <span class="crazy-card-art-label">METADATA ONLY</span>
            </div>
            <div class="crazy-card-body">
              <div class="crazy-card-topline"><span class="crazy-category">{{ categoryLabel(game) }}</span><span class="crazy-license">{{ licenseLabel(game.license_status) }}</span></div>
              <h3>{{ game.game_title }}</h3>
              <p class="crazy-slug">/{{ game.game_slug }}</p>
              <dl class="crazy-card-details">
                <div><dt>来源平台</dt><dd>{{ game.source_platform }}</dd></div>
                <div><dt>授权状态</dt><dd>{{ licenseLabel(game.license_status) }}</dd></div>
              </dl>
              <a class="crazy-source-link" :href="game.canonical_url" target="_blank" rel="noopener noreferrer">查看来源链接 <span aria-hidden="true">↗</span></a>
            </div>
          </article>
        </div>
        <div v-else class="crazy-empty" role="status">
          <span class="crazy-empty-mark" aria-hidden="true">∅</span>
          <strong>没有找到匹配记录</strong>
          <p>换一个关键词，或清除分类筛选后再试。</p>
          <button class="crazy-reset-button" type="button" @click="searchQuery = ''; selectedCategory = ''">显示全部 40 条记录</button>
        </div>
      </section>

      <footer class="crazy-metadata-footer">
        <div><span>数据来源 URL</span><a :href="crazyGamesHotSource.source_url" target="_blank" rel="noopener noreferrer">{{ crazyGamesHotSource.source_url }}</a></div>
        <div><span>生成时间</span><strong>{{ formatDate(crazyGamesHotSource.fetched_at) }}</strong></div>
        <p>来源平台：CrazyGames · 范围：公开元数据 · 缩略图地址未保存，页面不请求第三方图片。</p>
      </footer>
    </div>
  </PortalLayout>
</template>

<style scoped>
.crazy-metadata-page {
  --crazy-bg: #07131c;
  --crazy-panel: #0c202b;
  --crazy-panel-light: #12313a;
  --crazy-line: #244652;
  --crazy-text: #edf8f4;
  --crazy-muted: #8ca9ad;
  --crazy-teal: #61ddc0;
  --crazy-gold: #f2c96e;
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  overflow: hidden;
  padding: 52px 0 84px;
  color: var(--crazy-text);
  background: radial-gradient(circle at 86% 0, #204e4d 0, transparent 27%), radial-gradient(circle at 3% 38%, #122d49 0, transparent 31%), var(--crazy-bg);
}
.crazy-metadata-page::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  opacity: .42;
  background-image: linear-gradient(#5ad9c015 1px, transparent 1px), linear-gradient(90deg, #5ad9c015 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(to bottom, #000, transparent 82%);
  content: "";
  pointer-events: none;
}
.crazy-metadata-page::after { position: absolute; z-index: -1; top: 90px; right: -120px; width: 330px; height: 330px; border: 1px solid #f2c96e33; border-radius: 50%; box-shadow: 0 0 0 20px #f2c96e08, 0 0 0 46px #f2c96e05; content: ""; pointer-events: none; }
.crazy-hero, .crazy-notice, .crazy-stats, .crazy-directory, .crazy-metadata-footer { width: min(calc(100% - 40px), 1160px); margin-right: auto; margin-left: auto; }
.crazy-hero { display: flex; align-items: end; justify-content: space-between; gap: 30px; min-height: 290px; padding-bottom: 52px; }
.crazy-back { display: inline-flex; align-items: center; min-height: 32px; margin-bottom: 27px; color: var(--crazy-muted); font-size: 12px; text-decoration: none; }
.crazy-back::before { margin-right: 8px; color: var(--crazy-teal); content: "←"; }
.crazy-back:hover { color: var(--crazy-teal); }
.crazy-eyebrow { margin: 0 0 11px; color: var(--crazy-teal); font-size: 10px; font-weight: 800; letter-spacing: .17em; }
.crazy-hero h1 { margin: 0; color: var(--crazy-text); font-size: clamp(40px, 7vw, 78px); line-height: .98; letter-spacing: -.065em; }
.crazy-hero h1 em { color: var(--crazy-gold); font-style: normal; }
.crazy-intro { max-width: 525px; margin: 20px 0 0; color: var(--crazy-muted); font-size: 14px; line-height: 1.75; }
.crazy-hero-stamp { position: relative; display: grid; flex: 0 0 170px; place-items: center; width: 170px; height: 170px; border: 1px solid #61ddc088; border-radius: 50%; color: var(--crazy-teal); transform: rotate(8deg); }
.crazy-hero-stamp::before { position: absolute; inset: 13px; border: 1px dashed #f2c96e88; border-radius: 50%; content: ""; }
.crazy-hero-stamp span { position: absolute; top: 34px; font-size: 12px; font-weight: 800; letter-spacing: .18em; }
.crazy-hero-stamp strong { color: var(--crazy-gold); font-size: 22px; line-height: 1.05; text-align: center; letter-spacing: .08em; }
.crazy-hero-stamp i { position: absolute; bottom: 24px; width: 30px; height: 1px; background: var(--crazy-teal); }
.crazy-notice { display: flex; gap: 14px; padding: 17px 19px; border: 1px solid #b18a3f88; background: linear-gradient(100deg, #362c16cc, #1d271e99); }
.crazy-notice-mark { display: grid; flex: 0 0 23px; place-items: center; width: 23px; height: 23px; border: 1px solid var(--crazy-gold); border-radius: 50%; color: var(--crazy-gold); font-weight: 800; }
.crazy-notice strong { display: block; color: #ffe4a0; font-size: 13px; }
.crazy-notice p { margin: 5px 0 0; color: #c2ae7b; font-size: 11px; line-height: 1.65; }
.crazy-stats { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 16px; border: 1px solid var(--crazy-line); background: #0a1b25cc; }
.crazy-stats div { min-width: 0; padding: 20px 22px; border-right: 1px solid var(--crazy-line); }
.crazy-stats div:last-child { border-right: 0; }
.crazy-stats strong { display: block; overflow: hidden; color: var(--crazy-teal); font-size: 25px; letter-spacing: -.04em; text-overflow: ellipsis; white-space: nowrap; }
.crazy-stats div:nth-child(2) strong { color: var(--crazy-gold); }
.crazy-stats span { display: block; margin-top: 5px; color: var(--crazy-muted); font-size: 11px; }
.crazy-directory { padding-top: 64px; }
.crazy-section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 19px; }
.crazy-section-heading .crazy-eyebrow { margin-bottom: 5px; }
.crazy-section-heading h2 { margin: 0; color: var(--crazy-text); font-size: 24px; letter-spacing: -.04em; }
.crazy-section-heading h2 small { margin-left: 8px; color: var(--crazy-muted); font-size: 12px; font-weight: 400; letter-spacing: 0; }
.crazy-section-note { color: var(--crazy-muted); font-size: 11px; }
.crazy-toolbar { display: flex; gap: 9px; }
.crazy-search { display: flex; flex: 1; align-items: center; gap: 9px; min-height: 48px; padding: 0 14px; border: 1px solid var(--crazy-line); background: #091923dd; color: var(--crazy-teal); }
.crazy-search input { width: 100%; min-width: 0; border: 0; outline: 0; color: var(--crazy-text); background: transparent; font-size: 12px; }
.crazy-search input::placeholder { color: #638087; }
.crazy-reset, .crazy-reset-button { min-height: 44px; padding: 0 14px; border: 1px solid #80682f; color: var(--crazy-gold); background: transparent; font-size: 11px; cursor: pointer; }
.crazy-reset:hover, .crazy-reset-button:hover { border-color: var(--crazy-gold); background: #3b3018; }
.crazy-filters { display: flex; flex-wrap: wrap; gap: 7px; margin: 14px 0 20px; }
.crazy-filter { min-height: 32px; padding: 0 12px; border: 1px solid var(--crazy-line); color: var(--crazy-muted); background: #0b1d27; font-size: 11px; cursor: pointer; }
.crazy-filter:hover, .crazy-filter.active { border-color: var(--crazy-teal); color: #06151a; background: var(--crazy-teal); }
.crazy-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
.crazy-card { position: relative; min-width: 0; overflow: hidden; border: 1px solid var(--crazy-line); background: linear-gradient(145deg, #102b35, #091821 70%); transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
.crazy-card:hover { border-color: var(--crazy-teal); box-shadow: 0 12px 30px #0007, 0 0 20px #61ddc012; transform: translateY(-4px); }
.crazy-card-art { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 1.55 / 1; overflow: hidden; background: linear-gradient(135deg, color-mix(in srgb, var(--crazy-teal), #091923 58%), #07141b 78%); }
.crazy-card.pending-category .crazy-card-art { background: linear-gradient(135deg, #6c5530, #141c20 76%); }
.crazy-card-art::before { position: absolute; inset: 0; background: linear-gradient(135deg, transparent 42%, #ffffff0a 43% 44%, transparent 45%), repeating-linear-gradient(135deg, #ffffff08 0 1px, transparent 1px 13px); content: ""; }
.crazy-card-art::after { position: absolute; top: -25%; right: -12%; width: 100px; height: 100px; border: 1px solid #ffffff2b; border-radius: 50%; box-shadow: 0 0 0 12px #ffffff08, 0 0 0 24px #ffffff05; content: ""; }
.crazy-card-number { position: absolute; top: 10px; left: 11px; z-index: 1; color: #d0f6e9; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .1em; }
.crazy-card-glyph { position: relative; z-index: 1; color: #bff8e4; font-size: 42px; font-weight: 800; line-height: 1; text-shadow: 0 5px 22px #0009; }
.crazy-card-art-label { position: absolute; right: 10px; bottom: 9px; z-index: 1; color: #a7d4cb99; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8px; letter-spacing: .1em; }
.crazy-card-body { padding: 13px 13px 14px; }
.crazy-card-topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.crazy-category { overflow: hidden; color: var(--crazy-teal); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.pending-category .crazy-category { color: var(--crazy-gold); }
.crazy-license { flex: 0 0 auto; padding: 3px 5px; border: 1px solid #80682f; color: #e4c779; background: #302717; font-size: 9px; }
.crazy-card h3 { display: -webkit-box; overflow: hidden; min-height: 38px; margin: 7px 0 3px; color: var(--crazy-text); font-size: 16px; line-height: 1.2; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.crazy-slug { overflow: hidden; margin: 0; color: #718e94; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.crazy-card-details { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin: 15px 0 13px; }
.crazy-card-details div { min-width: 0; padding: 8px; border: 1px solid #1f3d47; background: #0a1b25; }
.crazy-card-details dt { color: #6e8b91; font-size: 9px; }
.crazy-card-details dd { overflow: hidden; margin: 4px 0 0; color: #c8ded9; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.crazy-source-link { display: flex; align-items: center; justify-content: space-between; min-height: 34px; border-top: 1px solid #20404a; color: var(--crazy-teal); font-size: 11px; text-decoration: none; }
.crazy-source-link:hover { color: var(--crazy-gold); }
.crazy-source-link span { font-size: 16px; }
.crazy-empty { display: grid; justify-items: center; gap: 9px; min-height: 260px; padding: 60px 20px; border: 1px dashed var(--crazy-line); text-align: center; }
.crazy-empty-mark { color: var(--crazy-gold); font-size: 32px; }
.crazy-empty strong { color: var(--crazy-text); font-size: 16px; }
.crazy-empty p { margin: 0 0 8px; color: var(--crazy-muted); font-size: 12px; }
.crazy-metadata-footer { display: grid; grid-template-columns: 1fr auto; gap: 12px 30px; margin-top: 64px; padding-top: 20px; border-top: 1px solid var(--crazy-line); color: var(--crazy-muted); font-size: 11px; }
.crazy-metadata-footer div { display: flex; flex-wrap: wrap; gap: 8px 14px; min-width: 0; }
.crazy-metadata-footer div span { color: #648188; }
.crazy-metadata-footer a { overflow-wrap: anywhere; color: var(--crazy-teal); text-decoration: none; }
.crazy-metadata-footer a:hover { color: var(--crazy-gold); }
.crazy-metadata-footer strong { color: #c7d9d5; font-weight: 400; }
.crazy-metadata-footer p { grid-column: 1 / -1; margin: 5px 0 0; color: #648188; line-height: 1.6; }
@media (max-width: 900px) { .crazy-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 680px) { .crazy-metadata-page { padding-top: 28px; } .crazy-hero, .crazy-notice, .crazy-stats, .crazy-directory, .crazy-metadata-footer { width: calc(100% - 24px); } .crazy-hero { align-items: start; min-height: 0; padding-bottom: 30px; } .crazy-hero-stamp { flex-basis: 96px; width: 96px; height: 96px; } .crazy-hero-stamp::before { inset: 8px; } .crazy-hero-stamp span { top: 19px; font-size: 8px; } .crazy-hero-stamp strong { font-size: 14px; } .crazy-hero-stamp i { bottom: 14px; width: 18px; } .crazy-hero h1 { font-size: clamp(34px, 10vw, 48px); } .crazy-intro { font-size: 12px; } .crazy-notice { padding: 13px; } .crazy-stats { grid-template-columns: repeat(2, 1fr); } .crazy-stats div { padding: 14px; border-bottom: 1px solid var(--crazy-line); } .crazy-stats div:nth-child(2) { border-right: 0; } .crazy-stats div:nth-child(3), .crazy-stats div:nth-child(4) { border-bottom: 0; } .crazy-directory { padding-top: 40px; } .crazy-section-heading { align-items: start; flex-direction: column; gap: 7px; } .crazy-toolbar { display: grid; grid-template-columns: 1fr auto; } .crazy-search { grid-column: 1 / -1; } .crazy-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; } .crazy-card-body { padding: 10px 9px 11px; } .crazy-card h3 { font-size: 14px; } .crazy-card-details { gap: 4px; margin-top: 11px; } .crazy-card-details div { padding: 6px; } .crazy-metadata-footer { grid-template-columns: 1fr; margin-top: 40px; } }
@media (max-width: 350px) { .crazy-hero, .crazy-notice, .crazy-stats, .crazy-directory, .crazy-metadata-footer { width: calc(100% - 16px); } .crazy-hero-stamp { flex-basis: 76px; width: 76px; height: 76px; } .crazy-hero-stamp strong { font-size: 11px; } .crazy-hero h1 { font-size: 31px; } .crazy-card-glyph { font-size: 32px; } .crazy-card-body { padding-right: 7px; padding-left: 7px; } .crazy-card h3 { font-size: 13px; } .crazy-license { max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .crazy-card-details { grid-template-columns: 1fr; } .crazy-card-details div:nth-child(2) { display: none; } }
@media (prefers-reduced-motion: reduce) { .crazy-card { transition: none; } }
</style>
