<script setup lang="ts">
import { ref } from "vue";

const claimed = ref(false);
function claimReward(): void {
  claimed.value = true;
}
</script>

<template>
  <section class="home-section reward-section" aria-labelledby="claimable-title">
    <p id="claimable-title" class="section-label">可领取</p>
    <div class="reward-row" :class="{ claimed }" aria-live="polite">
      <div class="reward-icon"><img src="/assets/icons/icon-idle-reward.svg" data-asset-id="HOME-REWARD-001" alt="挂机收益" /></div>
      <div class="reward-copy"><strong>{{ claimed ? "收益已领取" : "挂机收益" }}</strong><span>{{ claimed ? "下一次收益将在 01:58:42 后结算" : "金币 +1,240 · 已累积 2 小时" }}</span></div>
      <button v-if="!claimed" class="small-action" type="button" @click="claimReward">领取</button>
      <span v-else class="claimed-status">已领取</span>
    </div>
    <RouterLink class="reward-row task-row" to="/tasks">
      <div class="task-icon" aria-hidden="true"><img src="/assets/icons/icon-idle-reward.svg" data-asset-id="HOME-REWARD-001" alt="每日任务" /></div><div class="reward-copy"><strong>每日任务</strong><span>完成 3 场战斗 · 进度 2/3</span></div><span class="row-arrow" aria-hidden="true"><img src="/assets/icons/icon-nav-adventure.svg" data-asset-id="HOME-NAV-002" alt="查看任务" /></span>
    </RouterLink>
  </section>
</template>
