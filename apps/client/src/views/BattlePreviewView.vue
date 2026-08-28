<script setup lang="ts">
import { ref } from "vue";
import BottomNav from "../components/navigation/BottomNav.vue";
import { teamCards } from "../components/home/homeData";

const auto = ref(true);
const speed = ref(1);
const paused = ref(false);
</script>

<template>
  <div class="preview-shell battle-preview-shell">
    <header class="preview-topbar"><RouterLink class="preview-back" to="/zh" aria-label="返回首页">‹</RouterLink><div><p class="section-label">BATTLE PREVIEW · BATTLE-UI</p><strong>烽火残垣</strong></div><span class="preview-turn">第 3 回合</span></header>
    <main class="battle-preview-main">
      <section class="battle-stage" aria-label="遗迹战斗美术预览">
        <div class="battle-scene" data-asset-id="BATTLE-BG-001"></div>
        <div class="battle-depth mist-depth"></div>
        <div class="enemy-figure"><img :src="teamCards[3].assetPath" :data-asset-id="teamCards[3].assetId" alt="暗鸦敌方剪影" /><strong>噬火鸦卫</strong><div class="preview-hp enemy-hp"><i></i></div></div>
        <div class="battle-vs">VS</div>
        <div class="party-figures">
          <img v-for="card in teamCards.slice(0, 3)" :key="card.id" :src="card.assetPath" :data-asset-id="card.assetId" :alt="card.name" />
          <div class="party-label"><strong>星辉远征队</strong><span>12,480 战力</span></div>
        </div>
        <img class="battle-fx fx-slash" src="/assets/effects/fx-battle-slash.svg" data-asset-id="BATTLE-FX-001" alt="斩击特效" />
        <img class="battle-fx fx-talisman" src="/assets/effects/fx-battle-talisman.svg" data-asset-id="BATTLE-FX-002" alt="符箓特效" />
        <img class="battle-fx fx-heal" src="/assets/effects/fx-battle-heal.svg" data-asset-id="BATTLE-FX-003" alt="治疗特效" />
      </section>
      <section class="battle-command-panel">
        <div class="command-copy"><p class="section-label">战术控制台</p><strong>符箓已就绪</strong><small>灵火治疗冷却 04 秒</small></div>
        <div class="command-actions">
          <button type="button" :class="{ active: auto }" @click="auto = !auto"><img src="/assets/ui/battle-control-auto.svg" data-asset-id="BATTLE-UI-001" alt="" /><span>{{ auto ? "自动" : "手动" }}</span></button>
          <button type="button" :class="{ active: speed === 2 }" @click="speed = speed === 2 ? 1 : 2"><img src="/assets/ui/battle-control-speed.svg" data-asset-id="BATTLE-UI-002" alt="" /><span>×{{ speed }}</span></button>
          <button type="button" :class="{ active: paused }" @click="paused = !paused"><img src="/assets/ui/battle-control-pause.svg" data-asset-id="BATTLE-UI-003" alt="" /><span>{{ paused ? "继续" : "暂停" }}</span></button>
        </div>
      </section>
    </main>
    <BottomNav />
  </div>
</template>
