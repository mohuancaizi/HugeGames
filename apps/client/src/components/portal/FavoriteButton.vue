<script setup lang="ts">defineProps<{ active: boolean; title: string }>(); const emit = defineEmits<{ toggle: [] }>();</script>
<template><button class="favorite-button portal-favorite" type="button" :aria-pressed="active" :aria-label="active ? `取消收藏 ${title}` : `收藏 ${title}`" @click.stop="emit('toggle')">{{ active ? "★" : "☆" }}</button></template>
