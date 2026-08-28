<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGameAdapter, type Stage } from "../components/useGameAdapter";

const route = useRoute();
const router = useRouter();
const { stages, formation, totalPower } = useGameAdapter();
const notice = ref(route.query.result === "victory" ? "战斗结果待服务端同步。" : route.query.result === "defeat" ? "队伍结果待服务端同步。" : "");

function enterStage(stage: Stage): void {
  if (!stage.unlocked) {
    notice.value = "完成前置关卡后解锁此区域。";
    return;
  }
  void router.push(`/adventure/stages/${stage.id}`);
}
</script>

<template>
  <div class="page adventure-page">
    <section class="page-heading"><p class="eyebrow">主线地图 · 第 1 章</p><h1>迷雾森林</h1><p class="page-subtitle">穿过森林，寻找失落的星辉碎片。</p></section>
    <section class="team-strip"><div><span class="muted-label">出战队伍</span><strong>{{ formation.length }} / 3 位英雄</strong></div><div><span class="muted-label">队伍战力</span><strong>{{ Math.round(totalPower) }}</strong></div><RouterLink class="text-link" to="/cards">调整队伍 →</RouterLink></section>
    <p v-if="notice" class="inline-notice" role="status">{{ notice }}</p>
    <section class="stage-list" aria-label="章节关卡">
      <article v-for="(stage, index) in stages" :key="stage.id" class="stage-card" :class="{ locked: !stage.unlocked }">
        <div class="stage-number">{{ String(index + 1).padStart(2, "0") }}</div>
        <div class="stage-art" aria-hidden="true">{{ stage.emoji }}</div>
        <div class="stage-copy"><p class="eyebrow">关卡 {{ index + 1 }} · {{ stage.unlocked ? "可挑战" : "未解锁" }}</p><h2>{{ stage.title }}</h2><p>{{ stage.subtitle }}</p><small>敌人：{{ stage.enemy }} · 奖励：{{ stage.reward }} 金币</small></div>
        <button class="primary-button stage-button" type="button" :disabled="!stage.unlocked" @click="enterStage(stage)">{{ stage.unlocked ? "进入战斗" : "锁定" }} <span>→</span></button>
      </article>
    </section>
    <RouterLink class="secondary-button wide-button" to="/tasks">体力不足？去领取任务奖励</RouterLink>
  </div>
</template>
