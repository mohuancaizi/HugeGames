import type {
  CardConfig,
  CardId,
  EnemyConfig,
  GameConfig,
  StageConfig,
  StageId,
} from "./types";

const skill = (
  id: string,
  name: string,
  energyCost: number,
  ...effects: CardConfig["skills"][number]["effects"]
): CardConfig["skills"][number] => ({ id, name, energyCost, effects });

export const CARD_CONFIGS: readonly CardConfig[] = [
  {
    id: "aegis",
    name: "星盾守卫",
    role: "guardian",
    rarity: "rare",
    description: "以星辉护盾保护队友的守护者。",
    baseHp: 1450,
    baseAttack: 115,
    baseDefense: 95,
    speed: 82,
    basicPower: 1,
    skills: [skill("aegis-wall", "星壁", 3, { kind: "shield", power: 150, target: "allAllies" })],
  },
  {
    id: "ironclad",
    name: "铁壁骑士",
    role: "guardian",
    rarity: "epic",
    description: "沉稳可靠，能将伤害化为反击。",
    baseHp: 1850,
    baseAttack: 130,
    baseDefense: 115,
    speed: 65,
    basicPower: 1,
    skills: [skill("iron-taunt", "坚城", 4, { kind: "shield", power: 240, target: "self" })],
  },
  {
    id: "blade",
    name: "赤刃剑士",
    role: "warrior",
    rarity: "rare",
    description: "快速接近敌人并施展连续斩击。",
    baseHp: 980,
    baseAttack: 220,
    baseDefense: 55,
    speed: 112,
    basicPower: 1,
    skills: [skill("blade-storm", "烈风连斩", 3, { kind: "damage", power: 2.1, target: "singleEnemy" })],
  },
  {
    id: "ranger",
    name: "曙光猎手",
    role: "warrior",
    rarity: "epic",
    description: "精准打击后排，稳定提供物理输出。",
    baseHp: 900,
    baseAttack: 255,
    baseDefense: 48,
    speed: 125,
    basicPower: 1,
    skills: [skill("ranger-volley", "曙光箭雨", 4, { kind: "damage", power: 1.35, target: "allEnemies" })],
  },
  {
    id: "ember",
    name: "焚星术士",
    role: "mage",
    rarity: "legendary",
    description: "用灼热星火对敌方全体造成毁灭打击。",
    baseHp: 820,
    baseAttack: 290,
    baseDefense: 40,
    speed: 105,
    basicPower: 1,
    skills: [skill("ember-nova", "焚星爆裂", 5, { kind: "damage", power: 1.55, target: "allEnemies" })],
  },
  {
    id: "frost",
    name: "霜语法师",
    role: "mage",
    rarity: "epic",
    description: "冰霜法术能削弱敌人并制造喘息。",
    baseHp: 870,
    baseAttack: 245,
    baseDefense: 50,
    speed: 98,
    basicPower: 1,
    skills: [skill("frost-bind", "寒霜禁锢", 4, { kind: "damage", power: 1.2, target: "singleEnemy" }, { kind: "stun", power: 1, target: "singleEnemy", duration: 1 })],
  },
  {
    id: "luna",
    name: "月桂祭司",
    role: "support",
    rarity: "legendary",
    description: "治愈伤口并让队伍持续作战。",
    baseHp: 1020,
    baseAttack: 130,
    baseDefense: 65,
    speed: 90,
    basicPower: 1,
    skills: [skill("luna-grace", "月桂恩典", 4, { kind: "heal", power: 0.28, target: "allAllies" }, { kind: "shield", power: 100, target: "allAllies" })],
  },
] as const;

const enemy = (
  id: string,
  name: string,
  hp: number,
  attack: number,
  defense: number,
  speed: number,
): EnemyConfig => ({ id, name, baseHp: hp, baseAttack: attack, baseDefense: defense, speed, basicPower: 1, skills: [] });

export const STAGE_CONFIGS: readonly StageConfig[] = [
  { id: "meadow", name: "风语草原", description: "踏上旅途，击退徘徊的史莱姆。", recommendedPower: 450, enemies: [enemy("slime", "翠绿史莱姆", 850, 90, 25, 55)], clearReward: { gold: 120, gems: 5, summonStones: 1, experience: 40 }, firstClearReward: { gold: 200, gems: 20, summonStones: 2, experience: 60 } },
  { id: "ruins", name: "沉没遗迹", description: "古老遗迹中，骷髅兵守护着失落的宝藏。", recommendedPower: 800, unlockAfter: "meadow", enemies: [enemy("skeleton", "遗迹骷髅", 1250, 135, 45, 70)], clearReward: { gold: 180, gems: 6, summonStones: 1, experience: 60 }, firstClearReward: { gold: 300, gems: 25, summonStones: 3, experience: 90 } },
  { id: "mine", name: "晶矿深层", description: "晶兽在矿洞深处吸收了危险的魔力。", recommendedPower: 1250, unlockAfter: "ruins", enemies: [enemy("crystal-beast", "晶矿兽", 1800, 180, 65, 80)], clearReward: { gold: 250, gems: 7, summonStones: 2, experience: 85 }, firstClearReward: { gold: 420, gems: 30, summonStones: 4, experience: 120 } },
  { id: "citadel", name: "暮影城塞", description: "暗影骑士拦在通往王都的路上。", recommendedPower: 1850, unlockAfter: "mine", enemies: [enemy("shadow-knight", "暗影骑士", 2450, 245, 85, 88)], clearReward: { gold: 340, gems: 8, summonStones: 2, experience: 115 }, firstClearReward: { gold: 550, gems: 35, summonStones: 5, experience: 160 } },
  { id: "volcano", name: "熔火王座", description: "熔岩巨龙盘踞在火山王座。", recommendedPower: 2550, unlockAfter: "citadel", enemies: [enemy("magma-drake", "熔岩巨龙", 3300, 320, 105, 100)], clearReward: { gold: 460, gems: 10, summonStones: 3, experience: 150 }, firstClearReward: { gold: 720, gems: 45, summonStones: 6, experience: 210 } },
  { id: "abyss", name: "星渊尽头", description: "直面吞噬星光的深渊领主。", recommendedPower: 3500, unlockAfter: "volcano", enemies: [enemy("abyss-lord", "深渊领主", 4400, 410, 130, 115)], clearReward: { gold: 620, gems: 12, summonStones: 4, experience: 200 }, firstClearReward: { gold: 1000, gems: 60, summonStones: 8, experience: 280 } },
] as const;

export const GAME_CONFIG: GameConfig = {
  summon: {
    costGems: 100,
    count: 1,
    rates: { rare: 0.7, epic: 0.25, legendary: 0.05 },
    pityLimit: 10,
    pityRarity: "legendary",
  },
  idle: {
    intervalSeconds: 300,
    maxAccumulationSeconds: 8 * 60 * 60,
    goldPerInterval: 80,
    summonStonesPerInterval: 1,
    experiencePerInterval: 20,
  },
  formation: { maxSize: 4 },
};

export const CARD_CONFIG_BY_ID: Readonly<Record<CardId, CardConfig>> = Object.fromEntries(
  CARD_CONFIGS.map((card) => [card.id, card]),
) as Record<CardId, CardConfig>;

export const STAGE_CONFIG_BY_ID: Readonly<Record<StageId, StageConfig>> = Object.fromEntries(
  STAGE_CONFIGS.map((stage) => [stage.id, stage]),
) as Record<StageId, StageConfig>;

export const SAVE_SCHEMA_VERSION = 1;
export const STARTER_CARD_ID: CardId = "aegis";
