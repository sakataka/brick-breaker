import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import { GAME_BALANCE, STAGE_CATALOG, getStageByIndex } from "./config";
import { createItemState } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type { GameConfig, GameState, RandomSource } from "./types";
import { createVfxState } from "./vfxSystem";

function buildStageRound(state: GameState, config: GameConfig, random: RandomSource): void {
  const stage = getStageByIndex(state.campaign.stageIndex);
  const stageInitialSpeed = getStageInitialBallSpeed(config, state.campaign.stageIndex);
  state.lives = config.initialLives;
  state.bricks = buildBricksFromStage(stage);
  state.items = createItemState();
  state.assist = createAssistState(config);
  state.vfx = createVfxState(state.vfx.reducedMotion);
  state.paddle = createBasePaddle(config);
  state.balls = [createServeBall(config, state.paddle, GAME_BALANCE.ballRadius, random, stageInitialSpeed)];
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

  state.campaign.stageIndex += 1;
  buildStageRound(state, config, random);
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
