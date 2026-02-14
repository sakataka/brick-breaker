import type { SfxManager } from "../audio/sfx";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { playCollisionSounds } from "./collisionEffects";
import { GAME_BALANCE } from "./config";
import {
  applyItemPickup,
  ensureMultiballCount,
  getBombRadiusTiles,
  getPaddleScale,
  getPierceDepth,
  getSlowBallMaxSpeedScale,
  spawnDropsFromBrickEvents,
  updateFallingItems,
} from "./itemSystem";
import { runPhysicsForBalls } from "./physicsApply";
import { getStageInitialBallSpeed, getStageMaxBallSpeed } from "./roundSystem";
import type { Ball, GameConfig, GameState, RandomSource } from "./types";
import { applyCollisionEvents, spawnItemPickupFeedback } from "./vfxSystem";

export type PipelineOutcome = "continue" | "stageclear" | "ballloss";

export interface GamePipelineDeps {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  tryShieldRescue: (ball: Ball, maxSpeed: number) => boolean;
  playPickupSfx: () => void;
}

export function stepPlayingPipeline(state: GameState, deps: GamePipelineDeps): PipelineOutcome {
  const { config, random } = deps;
  state.elapsedSec += config.fixedDeltaSec;

  const stageInitialSpeed = getStageInitialBallSpeed(config, state.campaign.stageIndex);
  const stageMaxSpeed = getStageMaxBallSpeed(config, state.campaign.stageIndex);
  const maxWithAssist = getCurrentMaxBallSpeed(stageMaxSpeed, state.assist, state.elapsedSec);
  const effectiveMaxSpeed = maxWithAssist * getSlowBallMaxSpeedScale(state.items);
  const pierceDepth = getPierceDepth(state.items);
  const bombRadiusTiles = getBombRadiusTiles(state.items);

  const basePaddleWidth = GAME_BALANCE.paddleWidth * getPaddleScale(state.items);
  applyAssistToPaddle(state.paddle, basePaddleWidth, config.width, state.assist, state.elapsedSec);

  const physics = runPhysicsForBalls(state.balls, state.paddle, state.bricks, config, config.fixedDeltaSec, {
    maxBallSpeed: effectiveMaxSpeed,
    initialBallSpeed: stageInitialSpeed,
    pierceDepth,
    bombRadiusTiles,
    explodeOnHit: bombRadiusTiles > 0,
    onMiss: (target) => deps.tryShieldRescue(target, effectiveMaxSpeed),
  });

  state.score += physics.scoreGain;
  playCollisionSounds(deps.sfx, physics.events);
  applyCollisionEvents(state.vfx, physics.events, random);
  spawnDropsFromBrickEvents(state.items, physics.events, random);

  const picks = updateFallingItems(state.items, state.paddle, config.height, config.fixedDeltaSec);
  for (const pick of picks) {
    applyItemPickup(state.items, pick.type, physics.survivors);
    spawnItemPickupFeedback(state.vfx, pick.type, pick.pos.x, pick.pos.y);
  }
  if (picks.length > 0) {
    deps.playPickupSfx();
  }

  state.balls = ensureMultiballCount(state.items, physics.survivors, random);

  if (physics.hasClear) {
    return "stageclear";
  }
  if (state.balls.length <= 0) {
    return "ballloss";
  }
  return "continue";
}
