import type { BossLane, GameState, MetaProgress, StageModifierKey } from "../public";

export function calculateProgressRatio(state: GameState): number {
  return state.run.progress.totalEncounters <= 1
    ? 1
    : (state.run.progress.currentEncounterIndex + 1) / state.run.progress.totalEncounters;
}

export function getCourseBestScore(state: GameState, meta: MetaProgress): number {
  return state.run.threatTier === 2 ? meta.records.tier2BestScore : meta.records.tier1BestScore;
}

export function projectHudBoss(state: GameState) {
  return state.encounter.boss
    ? {
        hp: state.encounter.boss.hp,
        maxHp: state.encounter.boss.maxHp,
        phase: state.encounter.boss.phase,
        intent: state.encounter.boss.intent,
        castProgress: state.encounter.boss.telegraphProgress,
        weakWindowProgress: state.encounter.boss.punishProgress,
      }
    : undefined;
}

export function projectHudFlags(state: GameState) {
  return {
    hazardBoostActive: state.encounter.modifierKey === "speed_ball",
    pierceSlowSynergy:
      state.run.activeItems.some((item) => item.type === "pierce") &&
      state.run.activeItems.some((item) => item.type === "slow_ball"),
    magicCooldownSec: state.combat.activeSkill.remainingCooldownSec,
    warpLegendVisible: state.encounter.modifierKey === "warp_zone",
    steelLegendVisible: state.combat.bricks.some((brick) => brick.kind === "steel"),
    generatorLegendVisible: state.combat.bricks.some((brick) => brick.kind === "generator"),
    gateLegendVisible: state.combat.bricks.some((brick) => brick.kind === "gate"),
    turretLegendVisible: state.combat.bricks.some((brick) => brick.kind === "turret"),
  };
}

export function buildModifierLanes(modifierKey?: StageModifierKey): BossLane[] | undefined {
  if (modifierKey === "enemy_flux") {
    return ["left", "right"];
  }
  if (modifierKey === "flux") {
    return ["center"];
  }
  return undefined;
}
