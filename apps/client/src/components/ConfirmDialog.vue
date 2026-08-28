<script setup lang="ts">
defineProps<{ open: boolean; title: string; description: string; confirmLabel?: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div v-if="open" class="detail-backdrop" role="presentation" @click.self="emit('cancel')">
    <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="title">
      <p class="section-label">请确认</p><h2>{{ title }}</h2><p>{{ description }}</p>
      <div class="dialog-actions"><SecondaryButton @click="emit('cancel')">取消</SecondaryButton><PrimaryButton @click="emit('confirm')">{{ confirmLabel ?? "确认" }}</PrimaryButton></div>
    </section>
  </div>
</template>

<script lang="ts">import PrimaryButton from "./PrimaryButton.vue"; import SecondaryButton from "./SecondaryButton.vue";</script>
