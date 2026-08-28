<script setup lang="ts">
import { computed } from "vue";
import { useGameAdapter } from "../components/useGameAdapter";

const { tasks, idleReward } = useGameAdapter();
const claimableCount = computed(() => tasks.value.filter((task) => task.progress >= task.target && !task.claimed).length + (idleReward.value > 0 ? 1 : 0));
</script>

<template>
  <div class="page tasks-page">
    <section class="page-heading"><p class="eyebrow">每日委托 · {{ claimableCount }} 项可领取</p><h1>任务与收益</h1><p class="page-subtitle">完成简单目标，让你的远征持续成长。</p></section>
    <section class="idle-card"><div><p class="eyebrow">离线挂机收益</p><h2>{{ idleReward ? `${idleReward} 金币待服务端确认` : "暂无已确认收益" }}</h2><p>预览可以离线查看，领取金额与到账状态必须由服务端确认。</p></div><button class="primary-button" type="button" disabled>领取 · 等待确认</button></section>
    <p class="inline-notice" role="status">当前页面只展示最近同步快照，任务领取不会在客户端直接发奖。</p>
    <section class="task-list" aria-label="每日任务"><article v-for="task in tasks" :key="task.id" class="task-row"><span class="task-icon">{{ task.progress >= task.target ? "✓" : "○" }}</span><div class="task-copy"><strong>{{ task.title }}</strong><div class="task-progress"><span :style="{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }"></span></div><small>{{ task.progress }} / {{ task.target }} · {{ task.progress >= task.target && !task.claimed ? "claimable" : task.claimed ? "claimed" : "in_progress" }}</small></div><div class="task-reward"><span>◆ {{ task.reward }}</span><button class="secondary-button" type="button" disabled>{{ task.claimed ? "已领取" : task.progress >= task.target ? "待服务端确认" : "进行中" }}</button></div></article></section>
    <RouterLink class="primary-button wide-button" to="/adventure">去完成冒险任务 <span>→</span></RouterLink>
  </div>
</template>
