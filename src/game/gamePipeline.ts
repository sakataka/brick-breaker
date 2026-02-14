import type { SfxManager } from "../audio/sfx";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { playCollisionSounds } from "./collisionEffects";
import { applyComboHits, normalizeCombo, resetCombo } from "./comboSystem";
import { getGameplayBalance } from "./config";
import {
  applyItemPickup,
  clearActiveItemEffects,
  ensureMultiballCount,
  getBombRadiusTiles,
  getPaddleScale,
  getPierceDepth,
  getSlowBallMaxSpeedScale,
  spawnDropsFromBrickEvents,
  syncMultiballStacksWithBallCount,
  updateFallingItems,
} from "./itemSystem";
import { runPhysicsForBalls } from "./physicsApply";
import { getStageInitialBallSpeed, getStageMaxBallSpeed } from "./roundSystem";
import type { Ball, GameConfig, GameState, ItemType, RandomSource } from "./types";
import { applyCollisionEvents, spawnItemPickupFeedback } from "./vfxSystem";

export type PipelineOutcome = "continue" | "stageclear" | "ballloss";

export interface GamePipelineDeps {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  tryShieldRescue: (ball: Ball, maxSpeed: number) => boolean;
  playPickupSfx: (itemType: ItemType) => void;
}

export function stepPlayingPipeline(state: GameState, deps: GamePipelineDeps): PipelineOutcome {
  const { config, random } = deps;
  const balance = getGameplayBalance(config.difficulty);
  state.elapsedSec += config.fixedDeltaSec;

  const stageInitialSpeed = getStageInitialBallSpeed(config, state.campaign.stageIndex);
  const stageMaxSpeed = getStageMaxBallSpeed(config, state.campaign.stageIndex);
  const maxWithAssist = getCurrentMaxBallSpeed(stageMaxSpeed, state.assist, state.elapsedSec);
  const effectiveMaxSpeed = maxWithAssist * getSlowBallMaxSpeedScale(state.items);
  const pierceDepth = getPierceDepth(state.items);
  const bombRadiusTiles = getBombRadiusTiles(state.items);

  const basePaddleWidth = balance.paddleWidth * getPaddleScale(state.items);
  applyAssistToPaddle(state.paddle, basePaddleWidth, config.width, state.assist, state.elapsedSec);

  const physics = runPhysicsForBalls(state.balls, state.paddle, state.bricks, config, config.fixedDeltaSec, {
    maxBallSpeed: effectiveMaxSpeed,
    initialBallSpeed: stageInitialSpeed,
    pierceDepth,
    bombRadiusTiles,
    explodeOnHit: bombRadiusTiles > 0,
    onMiss: (target) => deps.tryShieldRescue(target, effectiveMaxSpeed),
  });

  const destroyedBricks = physics.events.filter((event) => event.kind === "brick").length;
  state.score += applyComboHits(state.combo, state.elapsedSec, destroyedBricks, balance.scorePerBrick);
  const hadBallDrop = physics.lostBalls > 0;
  const lostAllBalls = physics.survivors.length <= 0;
  playCollisionSounds(deps.sfx, physics.events);
  applyCollisionEvents(state.vfx, physics.events, random);
  spawnDropsFromBrickEvents(state.items, physics.events, random);

  const picks = updateFallingItems(state.items, state.paddle, config.height, config.fixedDeltaSec);
  let pickedMultiball = false;
  for (const pick of picks) {
    applyItemPickup(state.items, pick.type, physics.survivors);
    if (pick.type === "multiball") {
      pickedMultiball = true;
    }
    spawnItemPickupFeedback(state.vfx, pick.type, pick.pos.x, pick.pos.y);
  }
  for (const pick of picks.slice(0, 2)) {
    deps.playPickupSfx(pick.type);
  }

  if (lostAllBalls) {
    clearActiveItemEffects(state.items);
  }
  if (hadBallDrop) {
    resetCombo(state.combo);
  } else {
    normalizeCombo(state.combo, state.elapsedSec);
  }

  state.balls =
    pickedMultiball && !hadBallDrop
      ? ensureMultiballCount(state.items, physics.survivors, random, config.multiballMaxBalls)
      : physics.survivors;
  syncMultiballStacksWithBallCount(state.items, state.balls);

  if (physics.hasClear) {
    return "stageclear";
  }
  if (state.balls.length <= 0) {
    return "ballloss";
  }
  return "continue";
}
