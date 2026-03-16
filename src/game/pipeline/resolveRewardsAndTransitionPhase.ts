import { countAliveObjectiveBricks } from "../brickRules";
import { normalizeCombo, resetCombo } from "../comboSystem";
import {
  clearActiveItemEffects,
  ensureMultiballCount,
  spawnGuaranteedDrop,
  syncMultiballStacksWithBallCount,
} from "../itemSystem";
import { castMagicStrike } from "./magicPhase";
import { syncHeldBallsSnapshot, updateAutoLaserSpawner } from "./laserPhase";
import { syncLiveRecordState } from "../scoreSystem";
import type { GameState } from "../types";
import type {
  CollisionPhaseResult,
  GamePipelineDeps,
  PipelineOutcome,
  ScoringPhaseResult,
  TickContext,
} from "./gamePipelineTypes";

export function resolveRewardsAndTransitionPhase(
  state: GameState,
  deps: GamePipelineDeps,
  ctx: TickContext,
  collision: CollisionPhaseResult,
  scoring: ScoringPhaseResult,
): PipelineOutcome {
  if (scoring.comboFillTriggered) {
    deps.playComboFillSfx();
  }
  if (scoring.comboRewardTriggered) {
    const rewardOrigin = collision.physics.survivors[0] ?? state.combat.balls[0];
    const rewardX = rewardOrigin?.pos.x ?? state.combat.paddle.x + state.combat.paddle.width / 2;
    const rewardY = rewardOrigin?.pos.y ?? state.combat.paddle.y - 28;
    spawnGuaranteedDrop(state.combat.items, deps.random, rewardX, rewardY, {
      enabledItems: state.run.modulePolicy.enabledTypes,
    });
  }

  castMagicStrike(state, ctx.scoreScale, deps.random, deps.playMagicCastSfx);
  if (collision.hadBallDrop) {
    state.ui.styleBonus.chainLevel = 0;
    state.ui.styleBonus.noDropChainActive = false;
    resetCombo(state.run.combo);
  } else {
    state.ui.styleBonus.noDropChainActive = true;
    normalizeCombo(state.run.combo, state.run.elapsedSec);
  }

  state.combat.balls =
    collision.pickedMultiball && !collision.hadBallDrop
      ? ensureMultiballCount(
          state.combat.items,
          collision.physics.survivors,
          deps.random,
          deps.config.multiballMaxBalls,
        )
      : collision.physics.survivors;
  syncMultiballStacksWithBallCount(state.combat.items, state.combat.balls);
  syncHeldBallsSnapshot(state);
  if (!collision.lostAllBalls) {
    updateAutoLaserSpawner(state, ctx.pipelineDeltaSec, ctx.laserLevel);
  }

  if (state.encounter.forcedBallLoss) {
    state.encounter.forcedBallLoss = false;
    clearActiveItemEffects(state.combat.items);
    state.combat.balls = [];
    state.combat.laserProjectiles = [];
    state.combat.laserCooldownSec = 0;
    syncLiveRecordState(state);
    return "ballloss";
  }

  const clearedAfterMagic =
    ctx.hadAliveBricksBeforeTick && countAliveObjectiveBricks(state.combat.bricks) <= 0;
  if (collision.physics.hasClear || clearedAfterMagic) {
    syncLiveRecordState(state);
    return "stageclear";
  }
  if (state.combat.balls.length <= 0) {
    syncLiveRecordState(state);
    return "ballloss";
  }
  syncLiveRecordState(state);
  return "continue";
}
