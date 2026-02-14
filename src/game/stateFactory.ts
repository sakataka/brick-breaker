import { createAssistState } from "./assistSystem";
import { GAME_BALANCE, getStageByIndex, STAGE_CATALOG } from "./config";
import { createItemState } from "./itemSystem";
import { buildBricksFromStage } from "./level";
import { clamp } from "./math";
import type { Ball, GameConfig, GameState, Paddle, RandomSource, Scene } from "./types";
import { createVfxState } from "./vfxSystem";

export function createBasePaddle(config: GameConfig): Paddle {
  return {
    x: config.width / 2 - GAME_BALANCE.paddleWidth / 2,
    y: config.height - GAME_BALANCE.paddleBottomOffset,
    width: GAME_BALANCE.paddleWidth,
    height: GAME_BALANCE.paddleHeight,
  };
}

export function createRestingBall(config: GameConfig, paddle: Paddle, speed = config.initialBallSpeed): Ball {
  return {
    pos: {
      x: config.width / 2,
      y: paddle.y - (GAME_BALANCE.paddleHeight + GAME_BALANCE.ballRadius + 2),
    },
    vel: { x: 0, y: 0 },
    radius: GAME_BALANCE.ballRadius,
    speed,
  };
}

export function createServeBall(
  config: GameConfig,
  paddle: Paddle,
  radius: number,
  random: RandomSource,
  speed = config.initialBallSpeed,
): Ball {
  const spread = (random.next() - 0.5) * speed * GAME_BALANCE.serveSpreadRatio;
  const vx = clamp(spread, -speed * 0.45, speed * 0.45);
  const vy = -Math.sqrt(speed * speed - vx * vx);

  return {
    pos: {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - GAME_BALANCE.serveYOffset,
    },
    vel: { x: vx, y: vy },
    radius,
    speed,
  };
}

export function createInitialGameState(config: GameConfig, reducedMotion: boolean, scene: Scene): GameState {
  const stage = getStageByIndex(0);
  const stageSpeed = config.initialBallSpeed * stage.speedScale;
  const paddle = createBasePaddle(config);
  const ball = createRestingBall(config, paddle, stageSpeed);

  return {
    scene,
    score: 0,
    lives: config.initialLives,
    elapsedSec: 0,
    combo: {
      multiplier: 1,
      streak: 0,
      lastHitSec: -1,
    },
    stageStats: {
      hitsTaken: 0,
      startedAtSec: 0,
    },
    balls: [ball],
    paddle,
    bricks: buildBricksFromStage(stage),
    campaign: {
      stageIndex: 0,
      totalStages: STAGE_CATALOG.length,
      stageStartScore: 0,
    },
    items: createItemState(),
    assist: createAssistState(config),
    vfx: createVfxState(reducedMotion),
    errorMessage: null,
  };
}
