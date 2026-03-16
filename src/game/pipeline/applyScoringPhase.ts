import { applyComboHits } from "../comboSystem";
import { getBossDefinition } from "../config/bosses";
import { pushScoreFeed } from "../scoreSystem";
import type { GameState } from "../types";
import type {
  CollisionPhaseResult,
  CombatSimulationPhaseResult,
  EncounterScriptPhaseResult,
  ScoringPhaseResult,
  TickContext,
} from "./gamePipelineTypes";

export function applyScoringPhase(
  state: GameState,
  ctx: TickContext,
  encounter: EncounterScriptPhaseResult,
  combat: CombatSimulationPhaseResult,
  collision: CollisionPhaseResult,
): ScoringPhaseResult {
  state.run.score += combat.enemyScoreGain;
  if (combat.enemyScoreGain > 0) {
    pushScoreFeed(state, createFeedEntry("ENEMY DOWN", combat.enemyScoreGain, "score"));
  }
  if (encounter.cancelScoreGain > 0) {
    state.run.score += encounter.cancelScoreGain;
    pushScoreFeed(state, createFeedEntry("SHOT CANCEL", encounter.cancelScoreGain, "style"));
  }

  const baseScoreGain = applyComboHits(
    state.run.combo,
    state.run.elapsedSec,
    combat.destroyedBricks,
    ctx.balance.scorePerBrick,
  );
  state.run.score += Math.round(baseScoreGain * ctx.scoreScale);
  if (baseScoreGain > 0) {
    pushScoreFeed(
      state,
      createFeedEntry("CHAIN", Math.round(baseScoreGain * ctx.scoreScale), "score"),
    );
  }
  if (combat.eliteScorePenalty > 0) {
    state.run.score = Math.max(0, state.run.score - combat.eliteScorePenalty);
  }

  const styleBonusGain = applyStageStyleBonus(state, ctx, {
    destroyedBricks: combat.destroyedBricks,
    canceledShots: encounter.canceledShots,
    weakWindowActive: combat.weakWindowActive,
    hadBallDrop: collision.hadBallDrop,
    triggeredHazard: combat.triggeredHazard,
  });
  if (styleBonusGain > 0) {
    state.run.score += styleBonusGain;
  }
  const comboFillTriggered = !collision.comboFillBefore && state.run.combo.multiplier >= 2.5;
  if (comboFillTriggered) {
    state.run.combo.fillTriggered = true;
  }

  return {
    comboRewardTriggered: !collision.comboRewardBefore && state.run.combo.rewardGranted,
    comboFillTriggered,
  };
}

function applyStageStyleBonus(
  state: GameState,
  ctx: TickContext,
  input: {
    destroyedBricks: number;
    canceledShots: number;
    weakWindowActive: boolean;
    hadBallDrop: boolean;
    triggeredHazard: boolean;
  },
): number {
  let gain = 0;
  let label: string | null = null;
  switch (ctx.scoreFocus) {
    case "reactor_chain":
      if ((state.encounter.stats.generatorShutdown ?? false) && input.destroyedBricks >= 2) {
        gain = input.destroyedBricks * 70;
        label = "REACTOR CHAIN";
      }
      break;
    case "turret_cancel":
      if (input.canceledShots > 0) {
        gain = input.canceledShots * 120;
        label = "TURRET CANCEL";
      }
      break;
    case "boss_break": {
      const phaseRule = getBossDefinition(state.encounter.runtime.profile)?.phaseScoreRules.find(
        (rule) => rule.phase === state.encounter.bossPhase,
      );
      if (input.weakWindowActive && input.destroyedBricks > 0) {
        gain = input.destroyedBricks * (phaseRule?.bonusPerWeakHit ?? 60);
        label = "BREAK BURST";
      }
      break;
    }
    case "survival_chain":
      if (
        !input.hadBallDrop &&
        state.encounter.stats.hitsTaken <= 0 &&
        input.destroyedBricks >= 2
      ) {
        gain = input.destroyedBricks * 55;
        label = "SURVIVAL CHAIN";
      }
      break;
  }

  if (input.triggeredHazard && ctx.stageContext.stage.bonusRules?.includes("hazard_first")) {
    gain += 90;
    label = label ?? "HAZARD BREAK";
  }
  if (gain <= 0 || !label) {
    return 0;
  }

  state.ui.styleBonus.chainLevel += 1;
  pushScoreFeed(state, createFeedEntry(label, gain, "style"));
  return gain;
}

function createFeedEntry(
  label: string,
  amount: number,
  tone: "score" | "style" | "record",
): {
  label: string;
  amount: number;
  tone: "score" | "style" | "record";
  lifeMs: number;
  maxLifeMs: number;
} {
  return {
    label,
    amount,
    tone,
    lifeMs: 1600,
    maxLifeMs: 1600,
  };
}
