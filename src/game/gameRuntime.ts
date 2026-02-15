import type { SfxManager } from "../audio/sfx";
import { getGameplayBalance } from "./config";
import { stepPlayingPipeline } from "./gamePipeline";
import { consumeShield } from "./itemSystem";
import { applyLifeLoss, finalizeStageStats, retryCurrentStage } from "./roundSystem";
import type { Ball, GameConfig, GameState, ItemType, RandomSource } from "./types";
import { triggerHitFreeze, updateVfxState } from "./vfxSystem";

export function computeFrameDelta(
  lastFrameTime: number,
  timeSec: number,
): { delta: number; nextFrameTime: number } {
  const previous = lastFrameTime === 0 ? timeSec : lastFrameTime;
  return {
    delta: Math.min(0.25, timeSec - previous),
    nextFrameTime: timeSec,
  };
}

export function runPlayingLoop(
  state: GameState,
  deps: {
    config: GameConfig;
    random: RandomSource;
    sfx: SfxManager;
    playPickupSfx: (itemType: ItemType) => void;
    playComboFillSfx: () => void;
    playMagicCastSfx: () => void;
  },
  accumulator: number,
  delta: number,
  onStageClear: () => void,
  onBallLoss: () => void,
): number {
  let nextAccumulator = accumulator + delta;
  while (nextAccumulator >= deps.config.fixedDeltaSec) {
    nextAccumulator -= deps.config.fixedDeltaSec;
    if (state.vfx.hitFreezeMs > 0) {
      updateVfxState(state.vfx, deps.config.fixedDeltaSec, deps.random);
      continue;
    }
    const outcome = stepPlayingPipeline(state, {
      config: deps.config,
      random: deps.random,
      sfx: deps.sfx,
      tryShieldRescue: (ball, maxSpeed) => tryShieldRescue(state, deps.config, deps.random, ball, maxSpeed),
      playPickupSfx: deps.playPickupSfx,
      playComboFillSfx: deps.playComboFillSfx,
      playMagicCastSfx: deps.playMagicCastSfx,
    });
    updateVfxState(state.vfx, deps.config.fixedDeltaSec, deps.random);
    if (outcome === "stageclear") {
      onStageClear();
      break;
    }
    if (outcome === "ballloss") {
      onBallLoss();
      break;
    }
    if (state.scene !== "playing") {
      break;
    }
  }
  return nextAccumulator;
}

export function handleStageClear(
  state: GameState,
  config: GameConfig,
  onTransition: (event: "GAME_CLEAR" | "STAGE_CLEAR") => void,
): void {
  const balance = getGameplayBalance(config.difficulty);
  const persistResult = !state.options.debugModeEnabled || state.options.debugRecordResults;
  finalizeStageStats(state, persistResult);
  triggerHitFreeze(state.vfx, 72);
  state.score += state.lives * balance.clearBonusPerLife;
  onTransition(state.campaign.stageIndex >= state.campaign.totalStages - 1 ? "GAME_CLEAR" : "STAGE_CLEAR");
}

export function handleBallLoss(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  onGameOver: () => void,
): void {
  if (!applyLifeLoss(state, 1, config, random)) {
    retryCurrentStage(state, config, random);
    onGameOver();
  }
}

function tryShieldRescue(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  ball: Ball,
  fallbackSpeed: number,
): boolean {
  if (!consumeShield(state.items)) {
    return false;
  }
  state.combat.shieldBurstQueued = true;
  ball.pos.y = config.height - ball.radius - 10;
  ball.vel.y = -Math.max(120, Math.abs(ball.vel.y));
  if (Math.abs(ball.vel.x) < 40) {
    const spread = Math.max(40, fallbackSpeed * 0.28);
    ball.vel.x = (random.next() * 2 - 1) * spread;
  }
  return true;
}
