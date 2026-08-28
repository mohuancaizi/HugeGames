import { CARD_CONFIG_BY_ID, STAGE_CONFIG_BY_ID } from "./config";
import type {
  BattleLogEntry,
  BattleResult,
  BattleReward,
  CardConfig,
  EnemyConfig,
  OwnedCard,
  SkillConfig,
  SkillEffect,
  StageId,
} from "./types";

const MAX_ROUNDS = 30;
const MAX_ENERGY = 10;

type Side = "player" | "enemy";

interface BattleUnit {
  id: string;
  name: string;
  side: Side;
  config: CardConfig | EnemyConfig;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  energy: number;
  shield: number;
  stunnedRounds: number;
}

export interface BattleInput {
  stageId: StageId;
  formation: readonly OwnedCard[];
  firstClear: boolean;
}

function cardStats(card: CardConfig, owned: OwnedCard): Pick<BattleUnit, "maxHp" | "attack" | "defense" | "speed"> {
  const levelMultiplier = 1 + (Math.max(1, owned.level) - 1) * 0.08;
  return {
    maxHp: Math.floor(card.baseHp * levelMultiplier),
    attack: Math.floor(card.baseAttack * levelMultiplier),
    defense: Math.floor(card.baseDefense * levelMultiplier),
    speed: card.speed + Math.floor((Math.max(1, owned.level) - 1) * 0.5),
  };
}

function createPlayerUnits(formation: readonly OwnedCard[]): BattleUnit[] {
  return formation.flatMap((owned) => {
    const card = CARD_CONFIG_BY_ID[owned.cardId];
    if (!card) return [];
    const stats = cardStats(card, owned);
    return [{ id: `player-${owned.cardId}`, name: card.name, side: "player", config: card, hp: stats.maxHp, ...stats, energy: 0, shield: 0, stunnedRounds: 0 }];
  });
}

function createEnemyUnits(enemies: readonly EnemyConfig[]): BattleUnit[] {
  return enemies.map((config) => ({
    id: `enemy-${config.id}`,
    name: config.name,
    side: "enemy",
    config,
    hp: config.baseHp,
    maxHp: config.baseHp,
    attack: config.baseAttack,
    defense: config.baseDefense,
    speed: config.speed,
    energy: 0,
    shield: 0,
    stunnedRounds: 0,
  }));
}

function living(units: readonly BattleUnit[], side: Side): BattleUnit[] {
  return units.filter((unit) => unit.side === side && unit.hp > 0);
}

function targetsFor(effect: SkillEffect, actor: BattleUnit, units: readonly BattleUnit[]): BattleUnit[] {
  const allies = living(units, actor.side);
  const enemies = living(units, actor.side === "player" ? "enemy" : "player");
  switch (effect.target) {
    case "self": return [actor];
    case "singleEnemy": return enemies.slice(0, 1);
    case "allEnemies": return enemies;
    case "singleAlly": return allies.slice().sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp).slice(0, 1);
    case "allAllies": return allies;
  }
}

function dealDamage(target: BattleUnit, rawDamage: number): number {
  const damage = Math.max(1, Math.floor(rawDamage));
  const absorbed = Math.min(target.shield, damage);
  target.shield -= absorbed;
  const dealt = damage - absorbed;
  target.hp = Math.max(0, target.hp - dealt);
  return dealt;
}

function applyEffect(
  effect: SkillEffect,
  actor: BattleUnit,
  units: readonly BattleUnit[],
  round: number,
  logs: BattleLogEntry[],
  action: "skill" | "ultimate",
): void {
  for (const target of targetsFor(effect, actor, units)) {
    if (effect.kind === "damage") {
      const value = dealDamage(target, actor.attack * effect.power - target.defense * 0.2);
      logs.push({ round, actorId: actor.id, actorName: actor.name, action, message: `${actor.name} 对 ${target.name} 造成 ${value} 点技能伤害`, targetIds: [target.id], value });
    } else if (effect.kind === "heal") {
      const value = Math.min(target.maxHp - target.hp, Math.max(1, Math.floor(target.maxHp * effect.power)));
      target.hp = Math.min(target.maxHp, target.hp + value);
      logs.push({ round, actorId: actor.id, actorName: actor.name, action, message: `${actor.name} 为 ${target.name} 恢复 ${value} 点生命`, targetIds: [target.id], value });
    } else if (effect.kind === "shield") {
      target.shield += Math.max(1, Math.floor(effect.power));
      logs.push({ round, actorId: actor.id, actorName: actor.name, action, message: `${actor.name} 为 ${target.name} 添加 ${Math.floor(effect.power)} 点护盾`, targetIds: [target.id], value: Math.floor(effect.power) });
    } else {
      target.stunnedRounds = Math.max(target.stunnedRounds, effect.duration ?? 1);
      logs.push({ round, actorId: actor.id, actorName: actor.name, action, message: `${actor.name} 使 ${target.name} 眩晕 ${effect.duration ?? 1} 回合`, targetIds: [target.id], value: effect.duration ?? 1 });
    }
  }
}

function performAction(actor: BattleUnit, units: BattleUnit[], round: number, logs: BattleLogEntry[]): void {
  const skill = actor.config.skills.find((candidate) => candidate.energyCost <= actor.energy);
  if (skill) {
    actor.energy -= skill.energyCost;
    const action = skill.energyCost >= 5 ? "ultimate" : "skill";
    logs.push({ round, actorId: actor.id, actorName: actor.name, action, message: `${actor.name} 释放${skill.name}`, targetIds: [] });
    for (const effect of skill.effects) applyEffect(effect, actor, units, round, logs, action);
    return;
  }

  const target = living(units, actor.side === "player" ? "enemy" : "player")[0];
  if (!target) return;
  actor.energy = Math.min(MAX_ENERGY, actor.energy + 2);
  const value = dealDamage(target, actor.attack * actor.config.basicPower - target.defense * 0.35);
  logs.push({ round, actorId: actor.id, actorName: actor.name, action: "basic", message: `${actor.name} 普通攻击 ${target.name}，造成 ${value} 点伤害`, targetIds: [target.id], value });
}

function rewardFor(stageId: StageId, firstClear: boolean): BattleReward {
  const stage = STAGE_CONFIG_BY_ID[stageId];
  const clear = stage.clearReward;
  const first = firstClear ? stage.firstClearReward : { gold: 0, gems: 0, summonStones: 0, experience: 0 };
  return { gold: clear.gold + first.gold, gems: clear.gems + first.gems, summonStones: clear.summonStones + first.summonStones, experience: clear.experience + first.experience, firstClear };
}

export function runBattle(input: BattleInput): BattleResult {
  const stage = STAGE_CONFIG_BY_ID[input.stageId];
  const players = createPlayerUnits(input.formation);
  const enemies = createEnemyUnits(stage.enemies);
  const units = [...players, ...enemies];
  const logs: BattleLogEntry[] = [];
  let rounds = 0;

  if (players.length === 0) {
    return { outcome: "defeat", stageId: input.stageId, rounds: 0, logs: [{ round: 0, actorId: "system", actorName: "战场", action: "stunned", message: "没有可出战的卡牌", targetIds: [] }], reward: rewardFor(input.stageId, false), remainingPlayerHp: 0, remainingEnemyHp: enemies.reduce((sum, unit) => sum + unit.hp, 0) };
  }

  while (rounds < MAX_ROUNDS && living(units, "player").length > 0 && living(units, "enemy").length > 0) {
    rounds += 1;
    const order = units.filter((unit) => unit.hp > 0).sort((left, right) => right.speed - left.speed || left.id.localeCompare(right.id));
    for (const actor of order) {
      if (actor.hp <= 0 || living(units, actor.side === "player" ? "enemy" : "player").length === 0) continue;
      if (actor.stunnedRounds > 0) {
        actor.stunnedRounds -= 1;
        logs.push({ round: rounds, actorId: actor.id, actorName: actor.name, action: "stunned", message: `${actor.name} 被眩晕，无法行动`, targetIds: [actor.id] });
        continue;
      }
      performAction(actor, units, rounds, logs);
    }
  }

  const playersAlive = living(units, "player").length > 0;
  const enemiesAlive = living(units, "enemy").length > 0;
  const outcome = playersAlive && !enemiesAlive ? "victory" : !playersAlive && enemiesAlive ? "defeat" : "draw";
  if (outcome === "draw") logs.push({ round: rounds, actorId: "system", actorName: "战场", action: "stunned", message: `战斗达到 ${MAX_ROUNDS} 回合上限`, targetIds: [] });
  return {
    outcome,
    stageId: input.stageId,
    rounds,
    logs,
    reward: outcome === "victory" ? rewardFor(input.stageId, input.firstClear) : rewardFor(input.stageId, false),
    remainingPlayerHp: living(units, "player").reduce((sum, unit) => sum + unit.hp, 0),
    remainingEnemyHp: living(units, "enemy").reduce((sum, unit) => sum + unit.hp, 0),
  };
}

export { MAX_ROUNDS };
