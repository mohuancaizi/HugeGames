<script setup lang="ts">defineProps<{ label: string; type?: "button" | "submit" }>();</script>
<template><button class="icon-button" :type="type ?? 'button'" :aria-label="label" :title="label"><slot /></button></template>
