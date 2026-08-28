<script setup lang="ts">defineProps<{ tone?: "info" | "warning" | "error" | "success" }>();</script>
<template><div class="status-banner" :class="`status-${tone ?? 'info'}`" role="status"><slot /></div></template>
