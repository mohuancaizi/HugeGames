<script setup lang="ts">
import { quickEntries } from "./homeData";
</script>

<template>
  <section class="home-section quick-section" aria-labelledby="quick-title">
    <p id="quick-title" class="section-label">快捷入口</p>
    <div class="quick-grid">
      <RouterLink v-for="entry in quickEntries" :key="entry.label" :to="entry.path" class="quick-entry" :class="`tone-${entry.tone}`">
        <span class="quick-icon" aria-hidden="true"><img :src="entry.icon" :data-asset-id="entry.assetId" :alt="entry.label" /></span><strong>{{ entry.label }}</strong><small>{{ entry.description }}</small>
      </RouterLink>
    </div>
  </section>
</template>
