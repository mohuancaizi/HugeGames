<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGameAdapter } from "../components/useGameAdapter";

const route = useRoute();
const router = useRouter();
const { battle, formation, stages, attack, resolveBattle, startBattle } = useGameAdapter();
const stage = computed(() => stages.value.find((item) => item.id === battle.value?.stageId));
const playerHpPercent = computed(() => `${Math.max(0, ((battle.value?.playerHp ?? 0) / (battle.value?.playerMaxHp || 1)) * 100)}%`);
const enemyHpPercent = computed(() => `${Math.max(0, ((battle.value?.enemyHp ?? 0) / (battle.value?.enemyMaxHp || 1)) * 100)}%`);

onMounted(() => {
  if (!battle.value) {
    const stageId = typeof route.query.stage === "string" ? route.query.stage : stages.value[0]?.id;
    if (stageId) startBattle(stageId);
  }
});

function finishBattle(): void {
  const victory = resolveBattle();
  void router.push({ path: "/adventure", query: { result: victory ? "victory" : "defeat" } });
}
</script>

<template>
  <div class="page battle-page">
    <header class="battle-header"><RouterLink class="back-button" to="/adventure" aria-label="退出战斗">×</RouterLink><div><p class="eyebrow">第 {{ battle?.turn ?? 1 }} 回合</p><strong>{{ stage?.title ?? "战斗准备" }}</strong></div><span class="battle-auto">自动战斗</span></header>
    <section v-if="battle" class="battle-arena">
      <div class="combatant enemy-combatant"><span class="combatant-art">{{ stage?.emoji ?? "👾" }}</span><div class="combatant-name"><strong>{{ stage?.enemy }}</strong><small>敌方首领</small></div><div class="health-track"><span :style="{ width: enemyHpPercent }"></span></div><small>{{ battle.enemyHp }} / {{ battle.enemyMaxHp }} HP</small></div>
      <div class="battle-divider"><span>VS</span></div>
      <div class="combatant team-combatant"><div class="team-portraits"><span v-for="card in formation" :key="card.id" class="mini-portrait">{{ card.emoji }}</span></div><div class="combatant-name"><strong>星辉远征队</strong><small>我方队伍</small></div><div class="health-track health-player"><span :style="{ width: playerHpPercent }"></span></div><small>{{ battle.playerHp }} / {{ battle.playerMaxHp }} HP</small></div>
    </section>
    <section v-else class="state-panel"><strong>正在准备战斗</strong></section>

    <section v-if="battle" class="battle-controls">
      <div class="battle-log" aria-live="polite"><p v-for="(entry, index) in battle.log.slice(0, 3)" :key="`${entry}-${index}`">{{ entry }}</p></div>
      <div v-if="!battle.finished" class="battle-actions"><button class="primary-button battle-action" type="button" @click="attack">发动攻击 <span>→</span></button><button class="secondary-button battle-skill" type="button" @click="attack">释放合击</button></div>
      <div v-else class="battle-result" :class="{ defeat: !battle.victory }"><p class="eyebrow">战斗结束</p><h1>{{ battle.victory ? "冒险胜利" : "队伍败退" }}</h1><p>{{ battle.victory ? `获得 ${battle.reward} 金币奖励` : "整备队伍后再次挑战吧" }}</p><button class="primary-button" type="button" @click="finishBattle">查看结算 <span>→</span></button></div>
    </section>
  </div>
</template>
