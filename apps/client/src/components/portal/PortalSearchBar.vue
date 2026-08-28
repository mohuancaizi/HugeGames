<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
const router = useRouter(); const query = ref("");
function submit(): void { const value = query.value.trim(); void router.push({ path: "/zh/search", query: value ? { q: value } : {} }); }
</script>
<template><form class="portal-search" @submit.prevent="submit"><span aria-hidden="true">⌕</span><input v-model="query" type="search" maxlength="100" placeholder="搜索游戏、分类或标签" aria-label="搜索游戏" /><button v-if="!compact" type="submit">搜索</button></form></template>
