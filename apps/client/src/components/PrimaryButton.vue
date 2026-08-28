<script setup lang="ts">
defineProps<{ disabled?: boolean; loading?: boolean; type?: "button" | "submit" }>();
</script>

<template>
  <button class="primary-button" :disabled="disabled || loading" :type="type ?? 'button'"><span v-if="loading" class="loader" aria-hidden="true"></span><slot /> </button>
</template>
