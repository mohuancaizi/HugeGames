<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import PrimaryButton from "../components/PrimaryButton.vue";
import SecondaryButton from "../components/SecondaryButton.vue";
import StatusBanner from "../components/StatusBanner.vue";

const router = useRouter();
const loading = ref(false);
function continueBoot(): void {
  loading.value = true;
  window.setTimeout(() => { loading.value = false; void router.push("/onboarding"); }, 350);
}
</script>
<template>
  <div class="p0-page boot-page"><div class="p0-hero-mark">✦</div><p class="eyebrow">星辉远征 · P0</p><h1>灰烬边境</h1><p class="page-subtitle">正在恢复会话与最近一次同步的冒险进度。</p><StatusBanner>版本 0.1.0 · 启动页可离线打开</StatusBanner><div class="boot-progress"><span></span></div><p class="muted-copy">资源准备完成后继续。启动页不会发放奖励或修改资源。</p><PrimaryButton :loading="loading" @click="continueBoot">继续恢复</PrimaryButton><SecondaryButton @click="router.push('/offline')">查看离线说明</SecondaryButton></div>
</template>
