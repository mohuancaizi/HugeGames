<script setup lang="ts">import type { GameStatus } from "@arcade/shared"; defineProps<{ status: GameStatus }>(); const labels: Record<GameStatus, string> = { draft: "编辑中", review: "审核中", rejected: "未通过", published: "可玩", paused: "维护中", archived: "已归档" };</script>
<template><span class="game-status-badge" :class="`status-${status}`">{{ labels[status] }}</span></template>
