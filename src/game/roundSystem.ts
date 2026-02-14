import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import { GAME_BALANCE, getStageByIndex, getStageTimeTargetSec, RATING_CONFIG, STAGE_CATALOG } from "./config";
import { cloneActiveItemState, createItemState, ensureMultiballCount } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type { GameConfig, GameState, RandomSource } from "./types";
import { createVfxState } from "./vfxSystem";

interface BuildStageRoundOptions {
  carriedActiveItems?: GameState["items"]["active"];
}

function buildStageRound(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  options: BuildStageRoundOptions = {},
): void {
  const stage = getStageByIndex(state.campaign.stageIndex);
  const stageInitialSpeed = getStageInitialBallSpeed(config, state.campaign.stageIndex);
  state.lives = config.initialLives;
  state.bricks = buildBricksFromStage(stage);
  state.items = createItemState();
  if (options.carriedActiveItems) {
    state.items.active = cloneActiveItemState(options.carriedActiveItems);
  }
  state.assist = createAssistState(config);
  state.vfx = createVfxState(state.vfx.reducedMotion);
  state.paddle = createBasePaddle(config);
  state.balls = ensureMultiballCount(
    state.items,
    [createServeBall(config, state.paddle, GAME_BALANCE.ballRadius, random, stageInitialSpeed)],
    random,
  );
  state.combo = {
    multiplier: 1,
    streak: 0,
    lastHitSec: -1,
  };
  state.stageStats = {
    hitsTaken: 0,
    startedAtSec: state.elapsedSec,
  };
}

export function resetRoundState(
  state: GameState,
  config: GameConfig,
  reducedMotion: boolean,
  random: RandomSource,
): void {
  state.score = 0;
  state.elapsedSec = 0;
  state.campaign.stageIndex = 0;
  state.campaign.totalStages = STAGE_CATALOG.length;
  state.campaign.stageStartScore = 0;
  state.vfx = createVfxState(reducedMotion);
  buildStageRound(state, config, random);
  state.campaign.stageStartScore = state.score;
}

export function advanceStage(state: GameState, config: GameConfig, random: RandomSource): boolean {
  if (state.campaign.stageIndex >= state.campaign.totalStages - 1) {
    return false;
  }

  const carriedActiveItems = cloneActiveItemState(state.items.active);
  state.campaign.stageIndex += 1;
  buildStageRound(state, config, random, { carriedActiveItems });
  state.campaign.stageStartScore = state.score;
  return true;
}

export function retryCurrentStage(state: GameState, config: GameConfig, random: RandomSource): void {
  state.score = state.campaign.stageStartScore;
  buildStageRound(state, config, random);
}

export function applyLifeLoss(
  state: GameState,
  livesLost: number,
  config: GameConfig,
  random: RandomSource,
): boolean {
  state.lives -= livesLost;
  state.stageStats.hitsTaken += livesLost;
  if (state.lives <= 0) {
    return false;
  }

  activateAssist(state.assist, state.elapsedSec, config);
  const baseWidth = GAME_BALANCE.paddleWidth;
  applyAssistToPaddle(state.paddle, baseWidth, config.width, state.assist, state.elapsedSec);
  state.balls = [
    createServeBall(
      config,
      state.paddle,
      GAME_BALANCE.ballRadius,
      random,
      getStageInitialBallSpeed(config, state.campaign.stageIndex),
    ),
  ];
  return true;
}

export function getStageInitialBallSpeed(config: GameConfig, stageIndex: number): number {
  return config.initialBallSpeed * getStageByIndex(stageIndex).speedScale;
}

export function getStageMaxBallSpeed(config: GameConfig, stageIndex: number): number {
  return config.maxBallSpeed * getStageByIndex(stageIndex).speedScale;
}

export function finalizeStageStats(state: GameState): void {
  const clearTimeSec = Math.max(0, state.elapsedSec - state.stageStats.startedAtSec);
  const ratingScore = computeStageRatingScore(state, clearTimeSec);
  state.stageStats.clearedAtSec = state.elapsedSec;
  state.stageStats.ratingScore = ratingScore;
  state.stageStats.starRating = getStarRatingByScore(ratingScore);
}

export function getStageClearTimeSec(state: GameState): number | null {
  if (typeof state.stageStats.clearedAtSec !== "number") {
    return null;
  }
  return Math.max(0, state.stageStats.clearedAtSec - state.stageStats.startedAtSec);
}

export function getStarRatingByScore(score: number): 1 | 2 | 3 {
  if (score >= RATING_CONFIG.star3Min) {
    return 3;
  }
  if (score >= RATING_CONFIG.star2Min) {
    return 2;
  }
  return 1;
}

function computeStageRatingScore(state: GameState, clearTimeSec: number): number {
  const targetSec = getStageTimeTargetSec(state.campaign.stageIndex);
  const safeClearSec = Math.max(1, clearTimeSec);
  const timeScore = Math.max(
    0,
    Math.min(
      RATING_CONFIG.timeScoreMax,
      (targetSec / Math.max(targetSec, safeClearSec)) * RATING_CONFIG.timeScoreMax,
    ),
  );
  const hitScore = Math.max(
    0,
    RATING_CONFIG.hitScoreMax - state.stageStats.hitsTaken * RATING_CONFIG.hitPenalty,
  );
  const lifeScore = Math.max(
    0,
    Math.min(RATING_CONFIG.lifeScoreMax, state.lives * RATING_CONFIG.lifeScorePerLife),
  );
  return Math.round(timeScore + hitScore + lifeScore);
}
