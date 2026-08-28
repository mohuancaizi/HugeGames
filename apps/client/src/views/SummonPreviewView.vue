<script setup lang="ts">
import { ref } from "vue";
import BottomNav from "../components/navigation/BottomNav.vue";

const resultVisible = ref(true);
const notice = ref("");
function summon(mode: "single" | "ten"): void {
  notice.value = mode === "single" ? "星门回应了你的召唤" : "十道星辉正在汇聚";
  resultVisible.value = true;
}
</script>

<template>
  <div class="preview-shell summon-preview-shell">
    <header class="preview-topbar"><RouterLink class="preview-back" to="/zh" aria-label="返回首页">‹</RouterLink><div><p class="section-label">SUMMON PREVIEW · SUMMON-UI</p><strong>星夜回响</strong></div><span class="preview-turn">剩余 12 日</span></header>
    <main class="summon-preview-main">
      <section class="summon-stage" aria-label="天门召唤美术预览">
        <div class="summon-scene" data-asset-id="SUMMON-BG-001"></div>
        <img class="summon-gate" src="/assets/effects/fx-summon-gate.svg" data-asset-id="SUMMON-GATE-001" alt="召唤天门" />
        <div class="summon-copy"><p class="section-label">限时祈愿</p><h1>天门·星夜回响</h1><p>以星辉为引，唤醒沉睡的英魂</p></div>
        <div class="rarity-row"><span><img src="/assets/effects/fx-rarity-r.svg" data-asset-id="SUMMON-RARE-001" alt="R" />R</span><span><img src="/assets/effects/fx-rarity-sr.svg" data-asset-id="SUMMON-RARE-002" alt="SR" />SR</span><span><img src="/assets/effects/fx-rarity-ssr.svg" data-asset-id="SUMMON-RARE-003" alt="SSR" />SSR</span></div>
      </section>
      <p v-if="notice" class="summon-notice" role="status">{{ notice }}</p>
      <section class="summon-controls"><div class="probability-mark"><img src="/assets/ui/summon-probability-mark.svg" data-asset-id="SUMMON-UI-003" alt="" /><span>SSR 2.5%<small>概率详情</small></span></div><div class="summon-buttons"><button type="button" @click="summon('single')"><img src="/assets/ui/summon-button-single.svg" data-asset-id="SUMMON-UI-001" alt="" /><strong>单次召唤</strong><small>消耗 10 宝石</small></button><button type="button" @click="summon('ten')"><img src="/assets/ui/summon-button-ten.svg" data-asset-id="SUMMON-UI-002" alt="" /><strong>十连召唤</strong><small>必得 SR 以上</small></button></div></section>
      <section v-if="resultVisible" class="summon-result-card"><img class="result-frame" src="/assets/cards/card-result-frame.svg" data-asset-id="SUMMON-RESULT-001" alt="" /><div class="result-portrait"><img src="/assets/characters/character-dawn-bastion.svg" data-asset-id="HOME-CARD-001" alt="曙光壁垒" /></div><div><p class="section-label">最近获得 · SSR</p><h2>曙光壁垒</h2><span>玄甲营 · 守护 · Lv.18</span></div></section>
    </main>
    <BottomNav />
  </div>
</template>
