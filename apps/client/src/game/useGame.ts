import { computed } from "vue";
import { CARD_CONFIGS, CARD_CONFIG_BY_ID, GAME_CONFIG, STAGE_CONFIGS, STAGE_CONFIG_BY_ID } from "./config";
import { gameActions, gameState } from "./store";
import type { CardId, StageId } from "./types";

export function useGame() {
  const resources = computed(() => gameState.resources);
  const ownedCards = computed(() => gameState.ownedCards);
  const formation = computed(() => gameState.formation);
  const unlockedStages = computed(() => STAGE_CONFIGS.filter((stage) => gameState.unlockedStageIds.includes(stage.id)));
  const lockedStages = computed(() => STAGE_CONFIGS.filter((stage) => !gameState.unlockedStageIds.includes(stage.id)));
  const clearedStageIds = computed(() => gameState.clearedStageIds);
  const summonPity = computed(() => gameState.summonPity);
  const isInitialized = computed(() => gameState.initialized);
  const isSaving = computed(() => gameState.saving);
  const storageType = computed(() => gameState.storageType);
  const lastError = computed(() => gameState.lastError);
  const canSummon = computed(() => gameState.resources.gems >= GAME_CONFIG.summon.costGems);
  const idleElapsedSeconds = computed(() => Math.min(GAME_CONFIG.idle.maxAccumulationSeconds, Math.max(0, (Date.now() - gameState.idle.lastClaimAt) / 1000)));
  const idleIntervals = computed(() => Math.floor(idleElapsedSeconds.value / GAME_CONFIG.idle.intervalSeconds));
  const idleRewards = computed(() => ({
    gold: idleIntervals.value * GAME_CONFIG.idle.goldPerInterval,
    gems: 0,
    summonStones: idleIntervals.value * GAME_CONFIG.idle.summonStonesPerInterval,
    experience: idleIntervals.value * GAME_CONFIG.idle.experiencePerInterval,
  }));

  function getCard(cardId: CardId) {
    return CARD_CONFIG_BY_ID[cardId];
  }

  function getOwnedCard(cardId: CardId) {
    return gameState.ownedCards[cardId];
  }

  function getStage(stageId: StageId) {
    return STAGE_CONFIG_BY_ID[stageId];
  }

  return {
    state: gameState,
    config: GAME_CONFIG,
    cards: CARD_CONFIGS,
    stages: STAGE_CONFIGS,
    resources,
    ownedCards,
    formation,
    unlockedStages,
    lockedStages,
    clearedStageIds,
    summonPity,
    isInitialized,
    isSaving,
    storageType,
    lastError,
    canSummon,
    idleElapsedSeconds,
    idleIntervals,
    idleRewards,
    getCard,
    getOwnedCard,
    getStage,
    ...gameActions,
  };
}

export { CARD_CONFIGS, GAME_CONFIG, STAGE_CONFIGS, gameActions, gameState };
export type * from "./types";
