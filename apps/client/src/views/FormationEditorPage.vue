<script setup lang="ts">import CardsView from "./CardsView.vue"; import TopBar from "../components/TopBar.vue";</script>
<template><div class="formation-wrapper"><TopBar title="编队编辑" eyebrow="默认队伍" back-to="/cards"/><CardsView /><div class="formation-save-note">保存编队需要服务端确认，当前仅可查看本地草稿。</div></div></template>
