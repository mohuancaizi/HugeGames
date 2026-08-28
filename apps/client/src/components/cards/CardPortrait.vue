<script setup lang="ts">
import type { CardData } from "../home/homeData";

defineProps<{ card: CardData; selected?: boolean }>();
</script>

<template>
  <button class="card-portrait" :class="[`tone-${card.accent}`, { selected }]" type="button" :aria-label="`查看${card.name}详情`">
    <img class="card-character" :src="card.assetPath" :data-asset-id="card.assetId" :alt="card.name" />
    <img class="card-frame" :src="card.framePath" :data-asset-id="card.frameAssetId" alt="" aria-hidden="true" />
    <span class="card-role">{{ card.role }} · {{ card.faction }}</span>
    <span class="card-rarity">{{ card.rarity }}</span>
    <span class="card-caption"><strong>{{ card.name }}</strong><small>LV. 18 · 上阵</small></span>
  </button>
</template>
