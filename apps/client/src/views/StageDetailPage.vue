<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGameAdapter } from "../components/useGameAdapter";
import TopBar from "../components/TopBar.vue";
import PrimaryButton from "../components/PrimaryButton.vue";
import SecondaryButton from "../components/SecondaryButton.vue";
import OfflineState from "../components/OfflineState.vue";
const route = useRoute(); const router = useRouter(); const { stages, formation, totalPower } = useGameAdapter();
const stage = computed(() => stages.value.find(item => item.id === route.params.stageId));
</script>
<template>
  <div class="p0-page detail-page"><TopBar title="关卡详情" eyebrow="主线节点" back-to="/adventure"/><div v-if="stage" class="p0-content"><section class="detail-hero"><span class="stage-art-large">{{ stage.emoji }}</span><div><p class="eyebrow">{{ stage.unlocked ? "当前可挑战" : "未解锁" }}</p><h1>{{ stage.title }}</h1><p>{{ stage.subtitle }}</p></div></section><section class="info-grid"><div><small>推荐战力</small><strong>{{ stage.unlocked ? 420 : "—" }}</strong></div><div><small>体力消耗</small><strong>10</strong></div><div><small>敌方</small><strong>{{ stage.enemy }}</strong></div></section><section class="p0-panel"><p class="section-label">奖励预览</p><p>首通：金币、经验、内容配置奖励</p><p>重复：金币与经验</p><p>三星：在规定回合内完成并保留队伍生命</p></section><section class="p0-panel"><p class="section-label">当前编队</p><strong>{{ formation.length }} 人 · 战力 {{ Math.round(totalPower) }}</strong><p v-if="formation.length === 0" class="warning-copy">需要先配置队伍。</p><RouterLink class="text-link" to="/formation">编辑编队 →</RouterLink></section><OfflineState/><PrimaryButton class="fixed-cta" disabled>开始战斗 · 等待服务端确认</PrimaryButton><SecondaryButton @click="router.push('/adventure')">返回章节</SecondaryButton></div><div v-else class="p0-content"><div class="state-panel error-state"><strong>关卡不存在或尚未同步</strong><p>请返回冒险章节查看已缓存节点。</p><SecondaryButton @click="router.push('/adventure')">返回冒险</SecondaryButton></div></div></div>
</template>
