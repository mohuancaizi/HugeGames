<script setup lang="ts">
import { ref } from "vue";
import { useGameAdapter } from "../components/useGameAdapter";

const { resources, summon, lastSummon } = useGameAdapter();
const notice = ref("");
function summonCard(): void {
  const card = summon();
  notice.value = card ? `召唤成功，获得 ${card.name}！` : "宝石不足，需要 10 颗宝石。";
}
</script>

<template>
  <div class="page summon-page">
    <section class="page-heading"><p class="eyebrow">星辉召唤 · 限时召唤池</p><h1>召唤新的伙伴</h1><p class="page-subtitle">每一次星辉闪烁，都可能带来改变战局的英雄。</p></section>
    <section class="summon-banner"><div class="summon-banner-art" aria-hidden="true">✧</div><div><p class="eyebrow">本期推荐</p><h2>星夜回响</h2><p>SR 及以上卡牌出现概率提升。</p></div></section>
    <section class="summon-action"><div class="summon-cost"><span>◇</span><strong>{{ resources.gems }}</strong><small>当前宝石</small></div><button class="primary-button summon-button" type="button" @click="summonCard">单次召唤 · 10 宝石 <span>→</span></button></section>
    <p v-if="notice" class="inline-notice" role="status">{{ notice }}</p>
    <section v-if="lastSummon" class="summon-result"><p class="eyebrow">最近获得</p><span class="result-emoji">{{ lastSummon.emoji }}</span><h2>{{ lastSummon.name }}</h2><p>{{ lastSummon.rarity }} · {{ lastSummon.role }} · Lv. {{ lastSummon.level }}</p><RouterLink class="text-link" to="/cards">前往编队 →</RouterLink></section>
    <RouterLink class="secondary-button wide-button" to="/tasks">完成任务，获取更多资源</RouterLink>
  </div>
</template>
