<script setup lang="ts">
import { computed, ref } from "vue";
import { useGameAdapter, type Card } from "../components/useGameAdapter";

const { cards, formation, resources } = useGameAdapter();
const selectedId = ref(cards.value[0]?.id ?? "");
const notice = ref("");
const selectedCard = computed(() => cards.value.find((card) => card.id === selectedId.value) ?? cards.value[0]);
const isInFormation = computed(() => selectedCard.value ? formation.value.some((card) => card.id === selectedCard.value?.id) : false);

function chooseCard(card: Card): void {
  selectedId.value = card.id;
  notice.value = "";
}
</script>

<template>
  <div class="page cards-page">
    <section class="page-heading"><p class="eyebrow">英雄图鉴 · {{ cards.length }} 张卡牌</p><h1>我的卡牌</h1><p class="page-subtitle">组建三人小队，升级你的核心英雄。</p></section>
    <section class="formation-strip"><div><span class="muted-label">当前编队</span><strong>{{ formation.length }} / 3</strong></div><div class="formation-mini"><span v-for="card in formation" :key="card.id">{{ card.emoji }}</span></div><RouterLink class="text-link" to="/summon">去召唤 →</RouterLink></section>
    <p v-if="notice" class="inline-notice" role="status">{{ notice }}</p>
    <div class="card-layout">
      <section class="card-collection" aria-label="卡牌列表"><button v-for="card in cards" :key="card.id" class="card-tile" :class="{ selected: selectedCard?.id === card.id, formed: formation.some((item) => item.id === card.id) }" type="button" @click="chooseCard(card)"><span class="card-tile-art">{{ card.emoji }}</span><span class="card-tile-copy"><strong>{{ card.name }}</strong><small>{{ card.rarity }} · Lv. {{ card.level }}</small></span><span v-if="formation.some((item) => item.id === card.id)" class="formation-mark">上阵</span></button></section>
      <aside v-if="selectedCard" class="card-detail"><div class="card-detail-art">{{ selectedCard.emoji }}</div><p class="eyebrow">{{ selectedCard.rarity }} · {{ selectedCard.role }}</p><h2>{{ selectedCard.name }}</h2><div class="stat-row"><span>攻击</span><strong>{{ selectedCard.attack }}</strong><span>生命</span><strong>{{ selectedCard.hp }}</strong></div><button class="primary-button wide-button" type="button" disabled>{{ isInFormation ? "移出编队 · 待确认" : "加入编队 · 待确认" }}</button><button class="secondary-button wide-button" type="button" disabled>升级至 Lv. {{ selectedCard.level + 1 }} · 等待服务端确认</button><small class="balance-note">当前金币：{{ resources.gold }} · 写操作需要联网</small></aside>
    </div>
  </div>
</template>
