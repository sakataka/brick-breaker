import { activateAssist, applyAssistToPaddle, createAssistState } from "./assistSystem";
import { GAME_BALANCE } from "./config";
import { buildBricks } from "./level";
import { createBasePaddle, createServeBall } from "./stateFactory";
import type { GameConfig, GameState, RandomSource } from "./types";
import { createVfxState } from "./vfxSystem";

export function resetRoundState(
  state: GameState,
  config: GameConfig,
  reducedMotion: boolean,
  random: RandomSource,
): void {
  state.score = 0;
  state.lives = config.initialLives;
  state.elapsedSec = 0;
  state.bricks = buildBricks();
  state.assist = createAssistState(config);
  state.vfx = createVfxState(reducedMotion);
  state.paddle = createBasePaddle(config);
  state.ball = createServeBall(config, state.paddle, state.ball.radius, random);
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
  applyAssistToPaddle(state.paddle, GAME_BALANCE.paddleWidth, config.width, state.assist, state.elapsedSec);
  state.ball = createServeBall(config, state.paddle, state.ball.radius, random);
  return true;
}
