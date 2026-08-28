<script setup lang="ts">
import { ref } from "vue";
import TopBarResourceSummary from "../layout/TopBarResourceSummary.vue";
import MainQuestBanner from "./MainQuestBanner.vue";
import FormationSummary from "./FormationSummary.vue";
import ClaimableRewardRow from "./ClaimableRewardRow.vue";
import QuickEntryGrid from "./QuickEntryGrid.vue";
import CardPortrait from "../cards/CardPortrait.vue";
import { teamCards, type CardData } from "./homeData";

const selectedCard = ref<CardData | null>(null);
const showOffline = ref(false);
const previewStates = ["ready", "loading", "empty", "error"] as const;
type PreviewState = (typeof previewStates)[number];
const previewState = ref<PreviewState>("ready");

function setPreviewState(state: PreviewState): void {
  previewState.value = state;
}
</script>

<template>
  <div class="rpg-shell home-dashboard-shell" data-asset-id="HOME-BG-001" aria-label="灰烬边境首页">
    <TopBarResourceSummary />
    <main class="dashboard-main">
      <div v-if="showOffline" class="offline-strip" role="status"><span>离线缓存</span> 当前展示上次同步进度，领取和战斗需要联网。<button type="button" @click="showOffline = false">知道了</button></div>
      <div class="preview-status" aria-label="首页状态预览">
        <button v-for="state in previewStates" :key="state" type="button" :class="{ active: previewState === state }" @click="setPreviewState(state)">{{ state === 'ready' ? '正常' : state === 'loading' ? '加载' : state === 'empty' ? '空状态' : '错误' }}</button>
      </div>
      <div v-if="previewState === 'loading'" class="state-panel compact-state" role="status"><span class="loader"></span><strong>正在同步冒险进度</strong></div>
      <div v-else-if="previewState === 'empty'" class="state-panel compact-state"><span class="state-icon"><img src="/assets/icons/icon-idle-reward.svg" data-asset-id="HOME-REWARD-001" alt="" /></span><strong>还没有主线进度</strong><p>完成新手引导后开启灰烬边境。</p></div>
      <div v-else-if="previewState === 'error'" class="state-panel compact-state error-state" role="alert"><span class="state-icon"><img src="/assets/icons/icon-idle-reward.svg" data-asset-id="HOME-REWARD-001" alt="" /></span><strong>进度同步失败</strong><p>保留本地缓存，可稍后重试。</p><button class="secondary-button" type="button" @click="previewState = 'ready'">重试</button></div>
      <template v-else>
      <MainQuestBanner />
      <FormationSummary :cards="teamCards" @select="selectedCard = $event" />
      <ClaimableRewardRow />
      <QuickEntryGrid />
      <button class="offline-toggle" type="button" @click="showOffline = !showOffline">{{ showOffline ? "隐藏离线提示" : "查看网络状态" }}</button>
      </template>
    </main>
    <div v-if="selectedCard" class="detail-backdrop" role="presentation" @click.self="selectedCard = null">
      <section class="card-detail-dialog" role="dialog" aria-modal="true" :aria-labelledby="`card-title-${selectedCard.id}`">
        <button class="dialog-close" type="button" aria-label="关闭卡牌详情" @click="selectedCard = null"><img src="/assets/icons/icon-close.svg" alt="" /></button>
        <CardPortrait :card="selectedCard" selected />
        <div><p class="section-label">{{ selectedCard.role }} · 已上阵</p><h2 :id="`card-title-${selectedCard.id}`">{{ selectedCard.name }}</h2><p class="dialog-copy">这张卡牌正在队伍中发挥作用。前往卡牌页查看技能和养成详情。</p><RouterLink class="primary-button dialog-button" to="/cards" @click="selectedCard = null">查看卡牌</RouterLink></div>
      </section>
    </div>
  </div>
</template>
