<script setup lang="ts">
import CardPortrait from "../cards/CardPortrait.vue";
import type { CardData } from "./homeData";

defineProps<{ cards: CardData[] }>();
const emit = defineEmits<{ select: [card: CardData] }>();
</script>

<template>
  <section class="home-section formation-section" aria-labelledby="formation-title">
    <div class="section-heading compact-heading">
      <div><p class="section-label">当前队伍</p><h2 id="formation-title">12,480 <small>战力</small></h2></div>
      <RouterLink class="section-link" to="/cards">编队 <img src="/assets/icons/icon-chevron.svg" alt="查看卡牌编队" /></RouterLink>
    </div>
    <div class="formation-list">
      <CardPortrait v-for="card in cards" :key="card.id" :card="card" @click="emit('select', card)" />
    </div>
  </section>
</template>
