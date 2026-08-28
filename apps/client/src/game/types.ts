export type CardId =
  | "aegis"
  | "ironclad"
  | "blade"
  | "ranger"
  | "ember"
  | "frost"
  | "luna";

export type StageId = "meadow" | "ruins" | "mine" | "citadel" | "volcano" | "abyss";
export type CardRole = "guardian" | "warrior" | "mage" | "support";
export type CardRarity = "rare" | "epic" | "legendary";
export type TargetType = "self" | "singleEnemy" | "allEnemies" | "singleAlly" | "allAllies";
export type BattleOutcome = "victory" | "defeat" | "draw";
export type StorageType = "indexedDB" | "localStorage" | "memory";

export interface PlayerResources {
  gold: number;
  gems: number;
  summonStones: number;
  energy: number;
}

export interface SkillEffect {
  kind: "damage" | "heal" | "shield" | "stun";
  power: number;
  target: TargetType;
  duration?: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  energyCost: number;
  effects: readonly SkillEffect[];
}

export interface CardConfig {
  id: CardId;
  name: string;
  role: CardRole;
  rarity: CardRarity;
  description: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  speed: number;
  basicPower: number;
  skills: readonly SkillConfig[];
}

export interface OwnedCard {
  cardId: CardId;
  level: number;
  experience: number;
  copies: number;
}

export interface EnemyConfig {
  id: string;
  name: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  speed: number;
  basicPower: number;
  skills: readonly SkillConfig[];
}

export interface StageReward {
  gold: number;
  gems: number;
  summonStones: number;
  experience: number;
}

export interface StageConfig {
  id: StageId;
  name: string;
  description: string;
  recommendedPower: number;
  unlockAfter?: StageId;
  enemies: readonly EnemyConfig[];
  clearReward: StageReward;
  firstClearReward: StageReward;
}

export interface SummonConfig {
  costGems: number;
  count: number;
  rates: Readonly<Record<CardRarity, number>>;
  pityLimit: number;
  pityRarity: CardRarity;
}

export interface IdleConfig {
  intervalSeconds: number;
  maxAccumulationSeconds: number;
  goldPerInterval: number;
  summonStonesPerInterval: number;
  experiencePerInterval: number;
}

export interface FormationConfig {
  maxSize: number;
}

export interface GameConfig {
  summon: SummonConfig;
  idle: IdleConfig;
  formation: FormationConfig;
}

export interface IdleState {
  lastClaimAt: number;
}

export interface BattleLogEntry {
  round: number;
  actorId: string;
  actorName: string;
  action: "basic" | "skill" | "ultimate" | "stunned";
  message: string;
  targetIds: readonly string[];
  value?: number;
}

export interface BattleReward extends StageReward {
  firstClear: boolean;
}

export interface BattleResult {
  outcome: BattleOutcome;
  stageId: StageId;
  rounds: number;
  logs: readonly BattleLogEntry[];
  reward: BattleReward;
  remainingPlayerHp: number;
  remainingEnemyHp: number;
}

export interface SummonResult {
  cards: readonly CardId[];
  spentGems: number;
  pityCounter: number;
}

export interface SaveData {
  schemaVersion: number;
  resources: PlayerResources;
  ownedCards: Partial<Record<CardId, OwnedCard>>;
  formation: CardId[];
  unlockedStageIds: StageId[];
  clearedStageIds: StageId[];
  summonPity: number;
  idle: IdleState;
}

export interface GameState extends SaveData {
  initialized: boolean;
  saving: boolean;
  storageType: StorageType;
  lastError: string | null;
}
