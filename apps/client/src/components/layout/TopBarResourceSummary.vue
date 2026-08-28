<script setup lang="ts">
const resources = [
  { label: "金币", value: "12.8K", icon: "/assets/icons/icon-resource-gold.svg", assetId: "HOME-UI-001", tone: "gold" },
  { label: "宝石", value: "286", icon: "/assets/icons/icon-resource-gem.svg", assetId: "HOME-UI-002", tone: "teal" },
  { label: "体力", value: "42/60", icon: "/assets/icons/icon-resource-energy.svg", assetId: "HOME-UI-003", tone: "red" },
];
</script>

<template>
  <header class="home-topbar">
    <div class="player-summary">
      <button class="avatar-button" type="button" aria-label="打开玩家资料"><span>林</span></button>
      <div>
        <p class="player-kicker">冒险者 · Lv.18</p>
        <strong>林间微光</strong>
      </div>
    </div>
    <div class="resource-summary" aria-label="资源摘要">
      <div v-for="resource in resources" :key="resource.label" class="resource-chip" :class="`is-${resource.tone}`">
        <img :src="resource.icon" :data-asset-id="resource.assetId" :alt="resource.label" />
        <span>{{ resource.value }}</span>
      </div>
    </div>
  </header>
</template>
