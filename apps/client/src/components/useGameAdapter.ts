import { computed, reactive, ref } from "vue";
import { CARD_CONFIGS, CARD_CONFIG_BY_ID, GAME_CONFIG, STAGE_CONFIGS, STAGE_CONFIG_BY_ID } from "../game/config";
import { useGame } from "../game/useGame";
import type { CardId, StageId } from "../game/types";

export type CardRole = "tank" | "damage" | "support";

export interface Card {
  id: string;
  name: string;
  role: CardRole;
  rarity: string;
  level: number;
  attack: number;
  hp: number;
  emoji: string;
}

export interface Stage {
  id: string;
  title: string;
  subtitle: string;
  enemy: string;
  enemyHp: number;
  reward: number;
  emoji: string;
  unlocked: boolean;
}

export interface Task {
  id: string;
  title: string;
  progress: number;
  target: number;
  reward: number;
  claimed: boolean;
}

export interface BattleState {
  stageId: string;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: number;
  log: string[];
  finished: boolean;
  victory: boolean;
  reward: number;
}

const CARD_EMOJI: Record<CardId, string> = {
  aegis: "🛡️",
  ironclad: "⚔️",
  blade: "🗡️",
  ranger: "🏹",
  ember: "🔥",
  frost: "❄️",
  luna: "🌙",
};

const STAGE_EMOJI: Record<StageId, string> = {
  meadow: "🌿",
  ruins: "🏛️",
  mine: "💎",
  citadel: "🏰",
  volcano: "🌋",
  abyss: "🌀",
};

const uiState = reactive({
  tasks: [
    { id: "battle", title: "完成 3 场冒险战斗", progress: 0, target: 3, reward: 300, claimed: false },
    { id: "upgrade", title: "升级 1 张卡牌", progress: 0, target: 1, reward: 120, claimed: false },
    { id: "idle", title: "领取一次挂机收益", progress: 0, target: 1, reward: 80, claimed: false },
  ] as Task[],
});

const battleRef = ref<BattleState | null>(null);
const lastSummonRef = ref<Card | null>(null);
let battleRequest: Promise<void> | null = null;
let initializePromise: Promise<void> | null = null;

function ensureInitialized(): void {
  initializePromise ??= initializeGame().catch(() => undefined);
}

function roleFor(cardId: CardId): CardRole {
  const role = CARD_CONFIG_BY_ID[cardId].role;
  if (role === "guardian") return "tank";
  if (role === "support") return "support";
  return "damage";
}

function cardView(cardId: CardId): Card | null {
  const config = CARD_CONFIG_BY_ID[cardId];
  const owned = game.ownedCards.value[cardId];
  if (!owned) return null;
  const levelMultiplier = 1 + (Math.max(1, owned.level) - 1) * 0.08;
  return {
    id: config.id,
    name: config.name,
    role: roleFor(cardId),
    rarity: config.rarity.toUpperCase(),
    level: owned.level,
    attack: Math.floor(config.baseAttack * levelMultiplier),
    hp: Math.floor(config.baseHp * levelMultiplier),
    emoji: CARD_EMOJI[cardId],
  };
}

function stageView(stageId: StageId): Stage {
  const config = STAGE_CONFIG_BY_ID[stageId];
  const enemy = config.enemies[0];
  const reward = game.clearedStageIds.value.includes(stageId)
    ? config.clearReward.gold
    : config.clearReward.gold + config.firstClearReward.gold;
  return {
    id: config.id,
    title: config.name,
    subtitle: config.description,
    enemy: enemy?.name ?? "未知敌人",
    enemyHp: config.enemies.reduce((total, item) => total + item.baseHp, 0),
    reward,
    emoji: STAGE_EMOJI[stageId],
    unlocked: game.unlockedStages.value.some((item) => item.id === stageId),
  };
}

function cardIdFor(value: string): CardId | null {
  return value in CARD_CONFIG_BY_ID ? (value as CardId) : null;
}

function task(taskId: string): Task | undefined {
  return uiState.tasks.find((item) => item.id === taskId);
}

function updateBattleFromResult(result: Awaited<ReturnType<typeof game.challengeStage>>): void {
  const current = battleRef.value;
  if (!current) return;
  if (!result) {
    current.finished = true;
    current.victory = false;
    current.log.unshift("战斗无法开始，请检查关卡和体力。" );
    return;
  }
  current.playerHp = result.remainingPlayerHp;
  current.enemyHp = result.remainingEnemyHp;
  current.turn = Math.max(1, result.rounds);
  current.finished = true;
  current.victory = result.outcome === "victory";
  current.reward = current.victory ? result.reward.gold : 0;
  current.log = result.logs.map((entry) => entry.message).reverse();
  if (current.log.length === 0) current.log = [current.victory ? "敌人倒下了，冒险胜利！" : "队伍败退了，再整备一下吧。"];
}

const game = useGame();
const initializeGame = game.initializeGame;
const saveGame = game.saveGame;
const setFormation = game.setFormation;
const levelUpCard = game.levelUpCard;
const challengeStage = game.challengeStage;
const claimIdleRewards = game.claimIdleRewards;
const summonCards = game.summon;

const resources = computed(() => ({
  gold: game.resources.value.gold,
  gems: game.resources.value.gems,
  energy: game.resources.value.energy,
}));
const cards = computed(() => CARD_CONFIGS.flatMap((config) => {
  const card = cardView(config.id);
  return card ? [card] : [];
}));
const formation = computed(() => game.formation.value.flatMap((cardId) => {
  const card = cardView(cardId);
  return card ? [card] : [];
}));
const stages = computed(() => STAGE_CONFIGS.map((stage) => stageView(stage.id)));
const completedStageIds = computed(() => game.clearedStageIds.value);
const tasks = computed(() => uiState.tasks);
const battle = battleRef;
const totalPower = computed(() => formation.value.reduce((power, card) => power + card.attack + card.hp / 10, 0));
const idleReward = computed(() => game.idleRewards.value.gold);

function startBattle(stageId: string): boolean {
  const id = stageIdFor(stageId);
  if (!id || !game.unlockedStages.value.some((stage) => stage.id === id) || game.resources.value.energy <= 0 || formation.value.length === 0) return false;
  const stage = STAGE_CONFIG_BY_ID[id];
  const playerMaxHp = formation.value.reduce((total, card) => total + card.hp, 0);
  const enemyMaxHp = stage.enemies.reduce((total, enemy) => total + enemy.baseHp, 0);
  battleRef.value = {
    stageId: id,
    playerHp: playerMaxHp,
    playerMaxHp,
    enemyHp: enemyMaxHp,
    enemyMaxHp,
    turn: 1,
    log: [`${stage.enemies[0]?.name ?? "敌人"} 出现在战场。`],
    finished: false,
    victory: false,
    reward: stage.clearReward.gold + stage.firstClearReward.gold,
  };
  battleRequest = null;
  return true;
}

function attack(): void {
  const current = battleRef.value;
  if (!current || current.finished || battleRequest) return;
  battleRequest = challengeStage(current.stageId as StageId)
    .then(updateBattleFromResult)
    .catch(() => {
      if (!battleRef.value) return;
      battleRef.value.finished = true;
      battleRef.value.victory = false;
      battleRef.value.log.unshift("战斗结算失败，请稍后再试。" );
    })
    .finally(() => {
      battleRequest = null;
    });
}

function resolveBattle(): boolean {
  const current = battleRef.value;
  if (!current?.finished) return false;
  const victory = current.victory;
  if (victory) {
    const battleTask = task("battle");
    if (battleTask) battleTask.progress = Math.min(battleTask.target, battleTask.progress + 1);
  }
  battleRef.value = null;
  return victory;
}

function toggleFormation(cardId: string): void {
  const id = cardIdFor(cardId);
  if (!id || !game.ownedCards.value[id]) return;
  const current = [...game.formation.value];
  const index = current.indexOf(id);
  if (index >= 0) {
    if (current.length <= 1) return;
    current.splice(index, 1);
  } else {
    if (current.length >= GAME_CONFIG.formation.maxSize) return;
    current.push(id);
  }
  void setFormation(current);
}

function upgradeCard(cardId: string): boolean {
  const id = cardIdFor(cardId);
  if (!id) return false;
  const owned = game.ownedCards.value[id];
  if (!owned) return false;
  const cost = owned.level * 100;
  const experienceCost = owned.level * 50;
  if (game.resources.value.gold < cost || owned.experience < experienceCost) return false;
  void levelUpCard(id);
  const upgradeTask = task("upgrade");
  if (upgradeTask) upgradeTask.progress = Math.min(upgradeTask.target, upgradeTask.progress + 1);
  return true;
}

function predictedSummonId(pity: number): CardId {
  const rarity = pity + 1 >= GAME_CONFIG.summon.pityLimit
    ? GAME_CONFIG.summon.pityRarity
    : ((pity * 13) % 100 < GAME_CONFIG.summon.rates.legendary * 100
      ? "legendary"
      : (pity * 13) % 100 < (GAME_CONFIG.summon.rates.legendary + GAME_CONFIG.summon.rates.epic) * 100 ? "epic" : "rare");
  const candidates = CARD_CONFIGS.filter((card) => card.rarity === rarity);
  return candidates[pity % candidates.length]?.id ?? CARD_CONFIGS[0].id;
}

function cardPreview(cardId: CardId): Card {
  const config = CARD_CONFIG_BY_ID[cardId];
  return {
    id: config.id,
    name: config.name,
    role: roleFor(cardId),
    rarity: config.rarity.toUpperCase(),
    level: 1,
    attack: config.baseAttack,
    hp: config.baseHp,
    emoji: CARD_EMOJI[cardId],
  };
}

function summon(): Card | null {
  if (!game.canSummon.value) return null;
  const predictedId = predictedSummonId(game.summonPity.value);
  const request = summonCards(1);
  const predicted = cardPreview(predictedId);
  lastSummonRef.value = predicted;
  void request.then((result) => {
    const actualId = result?.cards[0];
    if (actualId) {
      const actual = cardView(actualId);
      if (actual) lastSummonRef.value = actual;
    }
  });
  return predicted;
}

function claimTask(taskId: string): boolean {
  const current = task(taskId);
  if (!current || current.claimed || current.progress < current.target) return false;
  current.claimed = true;
  game.resources.value.gold += current.reward;
  void saveGame();
  return true;
}

function claimIdle(): boolean {
  if (idleReward.value <= 0) return false;
  void claimIdleRewards();
  const idleTask = task("idle");
  if (idleTask) idleTask.progress = idleTask.target;
  return true;
}

function stageIdFor(value: string): StageId | null {
  return value in STAGE_CONFIG_BY_ID ? (value as StageId) : null;
}

export function useGameAdapter() {
  ensureInitialized();
  return {
    resources,
    cards,
    formation,
    stages,
    completedStageIds,
    tasks,
    battle,
    totalPower,
    idleReward,
    lastSummon: lastSummonRef,
    startBattle,
    attack,
    resolveBattle,
    toggleFormation,
    upgradeCard,
    summon,
    claimTask,
    claimIdle,
  };
}
