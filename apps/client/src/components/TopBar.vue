<script setup lang="ts">
defineProps<{ title: string; eyebrow?: string; backTo?: string }>();
</script>

<template>
  <header class="subpage-topbar app-topbar">
    <RouterLink v-if="backTo" class="back-button" :to="backTo" aria-label="返回">‹</RouterLink>
    <div class="topbar-title"><p v-if="eyebrow" class="section-label">{{ eyebrow }}</p><strong>{{ title }}</strong></div>
    <span class="topbar-spacer" aria-hidden="true"></span>
  </header>
</template>
