import { reactive } from "vue";
import { CARD_CONFIGS, CARD_CONFIG_BY_ID, GAME_CONFIG, SAVE_SCHEMA_VERSION, STAGE_CONFIG_BY_ID, STARTER_CARD_ID } from "./config";
import { runBattle } from "./battle";
import type {
  BattleResult,
  CardId,
  GameState,
  IdleState,
  OwnedCard,
  PlayerResources,
  SaveData,
  StageId,
  StageReward,
  StorageType,
  SummonResult,
} from "./types";

const STORAGE_KEY = "arcade-hub-card-rpg";
const DATABASE_NAME = "arcade-hub-card-rpg";
const DATABASE_VERSION = 1;
const OBJECT_STORE = "saves";

function defaultResources(): PlayerResources {
  return { gold: 500, gems: 300, summonStones: 3, energy: 20 };
}

function defaultIdle(): IdleState {
  return { lastClaimAt: Date.now() };
}

function defaultOwnedCards(): Partial<Record<CardId, OwnedCard>> {
  return { [STARTER_CARD_ID]: { cardId: STARTER_CARD_ID, level: 1, experience: 0, copies: 1 } };
}

function createDefaultState(): GameState {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    resources: defaultResources(),
    ownedCards: defaultOwnedCards(),
    formation: [STARTER_CARD_ID],
    unlockedStageIds: ["meadow"],
    clearedStageIds: [],
    summonPity: 0,
    idle: defaultIdle(),
    initialized: false,
    saving: false,
    storageType: "memory",
    lastError: null,
  };
}

export const gameState = reactive<GameState>(createDefaultState());
let saveQueue: Promise<void> = Promise.resolve();
let databasePromise: Promise<IDBDatabase | null> | null = null;

function isCardId(value: unknown): value is CardId {
  return typeof value === "string" && value in CARD_CONFIG_BY_ID;
}

function isStageId(value: unknown): value is StageId {
  return typeof value === "string" && value in STAGE_CONFIG_BY_ID;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function migrateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<SaveData>;
  const resources = candidate.resources as Partial<PlayerResources> | undefined;
  const ownedCards: Partial<Record<CardId, OwnedCard>> = {};
  if (candidate.ownedCards && typeof candidate.ownedCards === "object") {
    for (const [cardId, value] of Object.entries(candidate.ownedCards)) {
      if (!isCardId(cardId) || !value || typeof value !== "object") continue;
      const owned = value as Partial<OwnedCard>;
      ownedCards[cardId] = {
        cardId,
        level: Math.max(1, Math.floor(positiveNumber(owned.level, 1))),
        experience: Math.floor(positiveNumber(owned.experience, 0)),
        copies: Math.max(1, Math.floor(positiveNumber(owned.copies, 1))),
      };
    }
  }
  const formation = Array.isArray(candidate.formation) ? candidate.formation.filter(isCardId).slice(0, GAME_CONFIG.formation.maxSize) : [];
  const unlockedStageIds: StageId[] = Array.isArray(candidate.unlockedStageIds) ? candidate.unlockedStageIds.filter(isStageId) : ["meadow"];
  const clearedStageIds: StageId[] = Array.isArray(candidate.clearedStageIds) ? candidate.clearedStageIds.filter(isStageId) : [];
  if (!ownedCards[STARTER_CARD_ID]) ownedCards[STARTER_CARD_ID] = defaultOwnedCards()[STARTER_CARD_ID];
  if (formation.length === 0) formation.push(STARTER_CARD_ID);
  if (!unlockedStageIds.includes("meadow")) unlockedStageIds.unshift("meadow");

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    resources: {
      gold: Math.floor(positiveNumber(resources?.gold, 500)),
      gems: Math.floor(positiveNumber(resources?.gems, 300)),
      summonStones: Math.floor(positiveNumber(resources?.summonStones, 3)),
      energy: Math.floor(positiveNumber(resources?.energy, 20)),
    },
    ownedCards,
    formation,
    unlockedStageIds: [...new Set(unlockedStageIds)],
    clearedStageIds: [...new Set(clearedStageIds)],
    summonPity: Math.floor(positiveNumber(candidate.summonPity, 0)) % GAME_CONFIG.summon.pityLimit,
    idle: { lastClaimAt: positiveNumber((candidate.idle as Partial<IdleState> | undefined)?.lastClaimAt, Date.now()) },
  };
}

function saveData(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    resources: { ...gameState.resources },
    ownedCards: Object.fromEntries(Object.entries(gameState.ownedCards).map(([id, card]) => [id, card ? { ...card } : card])) as SaveData["ownedCards"],
    formation: [...gameState.formation],
    unlockedStageIds: [...gameState.unlockedStageIds],
    clearedStageIds: [...gameState.clearedStageIds],
    summonPity: gameState.summonPity,
    idle: { ...gameState.idle },
  };
}

function applySave(data: SaveData): void {
  gameState.schemaVersion = data.schemaVersion;
  gameState.resources = { ...data.resources };
  gameState.ownedCards = Object.fromEntries(Object.entries(data.ownedCards).map(([id, card]) => [id, card ? { ...card } : card])) as SaveData["ownedCards"];
  gameState.formation = [...data.formation];
  gameState.unlockedStageIds = [...data.unlockedStageIds];
  gameState.clearedStageIds = [...data.clearedStageIds];
  gameState.summonPity = data.summonPity;
  gameState.idle = { ...data.idle };
}

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

async function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(OBJECT_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readIndexedDb(): Promise<unknown | null> {
  databasePromise ??= openDatabase();
  const database = await databasePromise;
  if (!database) return null;
  return new Promise((resolve) => {
    try {
      const request = database.transaction(OBJECT_STORE, "readonly").objectStore(OBJECT_STORE).get(STORAGE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeIndexedDb(data: SaveData): Promise<boolean> {
  databasePromise ??= openDatabase();
  const database = await databasePromise;
  if (!database) return false;
  return new Promise((resolve) => {
    try {
      const request = database.transaction(OBJECT_STORE, "readwrite").objectStore(OBJECT_STORE).put(data, STORAGE_KEY);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function readPersisted(): Promise<{ data: SaveData | null; storageType: StorageType }> {
  const indexed = migrateSave(await readIndexedDb());
  if (indexed) return { data: indexed, storageType: "indexedDB" };
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { data: raw ? migrateSave(JSON.parse(raw)) : null, storageType: "localStorage" };
    } catch {
      return { data: null, storageType: "localStorage" };
    }
  }
  return { data: null, storageType: "memory" };
}

async function persist(): Promise<void> {
  const data = saveData();
  gameState.saving = true;
  saveQueue = saveQueue.then(async () => {
    const indexedWritten = await writeIndexedDb(data);
    if (indexedWritten) {
      gameState.storageType = "indexedDB";
      return;
    }
    if (hasLocalStorage()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        gameState.storageType = "localStorage";
        return;
      } catch {
        gameState.lastError = "本地存档写入失败，当前仅保留内存进度";
      }
    }
    gameState.storageType = "memory";
  }).catch((error: unknown) => {
    gameState.lastError = error instanceof Error ? error.message : "本地存档写入失败";
  }).finally(() => {
    gameState.saving = false;
  });
  return saveQueue;
}

function rarityBucket(index: number, pity: number): "rare" | "epic" | "legendary" {
  if (pity + 1 >= GAME_CONFIG.summon.pityLimit) return GAME_CONFIG.summon.pityRarity;
  const roll = (index * 37 + pity * 13) % 100;
  return roll < GAME_CONFIG.summon.rates.legendary * 100 ? "legendary" : roll < (GAME_CONFIG.summon.rates.legendary + GAME_CONFIG.summon.rates.epic) * 100 ? "epic" : "rare";
}

function selectCard(index: number, pity: number): CardId {
  const rarity = rarityBucket(index, pity);
  const candidates = CARD_CONFIGS.filter((card) => card.rarity === rarity);
  return candidates[(index + pity) % candidates.length]?.id ?? STARTER_CARD_ID;
}

function addOwnedCard(cardId: CardId): void {
  const current = gameState.ownedCards[cardId];
  if (current) current.copies += 1;
  else gameState.ownedCards[cardId] = { cardId, level: 1, experience: 0, copies: 1 };
}

export async function initializeGame(): Promise<void> {
  if (gameState.initialized) return;
  const persisted = await readPersisted();
  if (persisted.data) applySave(persisted.data);
  gameState.storageType = persisted.storageType;
  gameState.initialized = true;
  await persist();
}

export async function saveGame(): Promise<void> {
  await persist();
}

export async function setFormation(cardIds: readonly CardId[]): Promise<boolean> {
  const valid = [...new Set(cardIds)].filter((cardId) => Boolean(gameState.ownedCards[cardId])).slice(0, GAME_CONFIG.formation.maxSize);
  if (valid.length === 0) return false;
  gameState.formation = valid;
  await persist();
  return true;
}

export async function levelUpCard(cardId: CardId): Promise<boolean> {
  const card = gameState.ownedCards[cardId];
  if (!card) return false;
  const cost = card.level * 100;
  const experienceCost = card.level * 50;
  if (gameState.resources.gold < cost || card.experience < experienceCost) return false;
  gameState.resources.gold -= cost;
  card.experience -= experienceCost;
  card.level += 1;
  await persist();
  return true;
}

export async function summon(count = GAME_CONFIG.summon.count): Promise<SummonResult | null> {
  const summonCount = Math.max(1, Math.floor(count));
  const totalCost = GAME_CONFIG.summon.costGems * summonCount;
  if (gameState.resources.gems < totalCost) return null;
  const cards: CardId[] = [];
  let pity = gameState.summonPity;
  for (let index = 0; index < summonCount; index += 1) {
    const cardId = selectCard(index, pity);
    cards.push(cardId);
    addOwnedCard(cardId);
    pity = CARD_CONFIG_BY_ID[cardId].rarity === GAME_CONFIG.summon.pityRarity ? 0 : pity + 1;
  }
  gameState.resources.gems -= totalCost;
  gameState.summonPity = pity;
  await persist();
  return { cards, spentGems: totalCost, pityCounter: pity };
}

export async function challengeStage(stageId: StageId): Promise<BattleResult | null> {
  if (!gameState.unlockedStageIds.includes(stageId)) return null;
  const formation = gameState.formation.flatMap((cardId) => {
    const card = gameState.ownedCards[cardId];
    return card ? [card] : [];
  });
  const result = runBattle({ stageId, formation, firstClear: !gameState.clearedStageIds.includes(stageId) });
  if (result.outcome === "victory") {
    const reward = result.reward;
    gameState.resources.gold += reward.gold;
    gameState.resources.gems += reward.gems;
    gameState.resources.summonStones += reward.summonStones;
    for (const owned of Object.values(gameState.ownedCards)) if (owned) owned.experience += reward.experience;
    if (!gameState.clearedStageIds.includes(stageId)) gameState.clearedStageIds.push(stageId);
    const nextStage = Object.values(STAGE_CONFIG_BY_ID).find((candidate) => candidate.unlockAfter === stageId);
    if (nextStage && !gameState.unlockedStageIds.includes(nextStage.id)) gameState.unlockedStageIds.push(nextStage.id);
    gameState.resources.energy = Math.max(0, gameState.resources.energy - 1);
    await persist();
  }
  return result;
}

export async function claimIdleRewards(now = Date.now()): Promise<StageReward> {
  const elapsed = Math.min(GAME_CONFIG.idle.maxAccumulationSeconds, Math.max(0, (now - gameState.idle.lastClaimAt) / 1000));
  const intervals = Math.floor(elapsed / GAME_CONFIG.idle.intervalSeconds);
  const reward: StageReward = {
    gold: intervals * GAME_CONFIG.idle.goldPerInterval,
    gems: 0,
    summonStones: intervals * GAME_CONFIG.idle.summonStonesPerInterval,
    experience: intervals * GAME_CONFIG.idle.experiencePerInterval,
  };
  if (intervals > 0) {
    gameState.resources.gold += reward.gold;
    gameState.resources.summonStones += reward.summonStones;
    for (const owned of Object.values(gameState.ownedCards)) if (owned) owned.experience += reward.experience;
    gameState.idle.lastClaimAt = now;
    await persist();
  }
  return reward;
}

export const gameActions = {
  initializeGame,
  saveGame,
  setFormation,
  levelUpCard,
  summon,
  challengeStage,
  claimIdleRewards,
};

export { STORAGE_KEY };
