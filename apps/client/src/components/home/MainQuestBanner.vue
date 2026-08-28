<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
function continueAdventure(): void {
  void router.push("/adventure");
}
</script>

<template>
  <section class="quest-banner" aria-labelledby="quest-title">
    <div class="quest-art" data-asset-id="HOME-HERO-001" aria-hidden="true"></div>
    <img class="quest-glow" src="/assets/hero/hero-chapter-seal.svg" data-asset-id="HOME-HERO-002" alt="章节符印" />
    <div class="chapter-badge" aria-label="第 7 关"><span>CHAPTER</span><strong>07</strong></div>
    <div class="quest-content">
      <p class="section-label">主线进度 <span>· 第 7 关</span></p>
      <h1 id="quest-title">灰烬边境</h1>
      <p class="quest-description">穿过沉睡的烽火线，寻找失落的曙光。</p>
      <div class="quest-progress-row"><div class="progress-track"><span></span></div><strong>65%</strong></div>
      <button class="primary-button quest-button" type="button" @click="continueAdventure">继续冒险 <img src="/assets/icons/icon-chevron.svg" alt="" /></button>
    </div>
    <div class="quest-sigil" aria-hidden="true"><span></span></div>
  </section>
</template>
