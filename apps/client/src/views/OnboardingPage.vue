<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import PrimaryButton from "../components/PrimaryButton.vue";
import SecondaryButton from "../components/SecondaryButton.vue";
import StatusBanner from "../components/StatusBanner.vue";
const router = useRouter();
const step = ref(1);
</script>
<template>
  <div class="p0-page onboarding-page"><p class="eyebrow">新手旅程 · {{ step }} / 3</p><div class="step-dots"><i v-for="item in 3" :key="item" :class="{ active: item <= step }"></i></div><h1>{{ step === 1 ? "听见星辉的召唤" : step === 2 ? "组建第一支队伍" : "准备踏入战场" }}</h1><p class="page-subtitle">{{ step === 1 ? "灰烬边境的雾正在靠近，先确认你的远征身份。" : step === 2 ? "初始卡牌、编队和战斗结果都将由服务端确认。" : "完成引导后进入主线，任何奖励不会由客户端直接发放。" }}</p><StatusBanner tone="warning">首次存档、初始奖励和首战需要联网确认。</StatusBanner><div class="onboarding-reward"><span>✧</span><div><strong>初始旅资预览</strong><small>资源与卡牌仅展示服务端返回结果</small></div></div><div class="p0-actions"><SecondaryButton v-if="step > 1" @click="step -= 1">上一步</SecondaryButton><PrimaryButton v-if="step < 3" @click="step += 1">下一步</PrimaryButton><PrimaryButton v-else @click="router.push('/zh')">进入首页</PrimaryButton></div><button class="text-button" type="button" @click="router.push('/zh')">跳过说明</button></div>
</template>
