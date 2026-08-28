<script setup lang="ts">defineProps<{ label?: string }>();</script>
<template><div class="state-panel loading-state" role="status"><span class="loader"></span><strong>{{ label ?? "正在加载" }}</strong></div></template>
