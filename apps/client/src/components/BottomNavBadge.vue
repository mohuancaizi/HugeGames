<script setup lang="ts">defineProps<{ count?: number }>();</script>
<template><i v-if="(count ?? 0) > 0" class="nav-badge" aria-label="有可领取内容">{{ count }}</i></template>
