import { clamp } from "./math";
import type { AssistState, GameConfig, Paddle } from "./types";

export function createAssistState(
  config: Pick<GameConfig, "assistPaddleScale" | "assistMaxSpeedScale">,
): AssistState {
  return {
    untilSec: 0,
    paddleScale: config.assistPaddleScale,
    maxSpeedScale: config.assistMaxSpeedScale,
  };
}

export function activateAssist(
  assist: AssistState,
  elapsedSec: number,
  config: Pick<GameConfig, "assistDurationSec">,
): void {
  assist.untilSec = elapsedSec + config.assistDurationSec;
}

export function isAssistActive(assist: AssistState, elapsedSec: number): boolean {
  return elapsedSec < assist.untilSec;
}

export function getCurrentMaxBallSpeed(
  baseMaxSpeed: number,
  assist: AssistState,
  elapsedSec: number,
): number {
  if (!isAssistActive(assist, elapsedSec)) {
    return baseMaxSpeed;
  }
  return baseMaxSpeed * assist.maxSpeedScale;
}

export function applyAssistToPaddle(
  paddle: Paddle,
  baseWidth: number,
  worldWidth: number,
  assist: AssistState,
  elapsedSec: number,
): void {
  const targetWidth = baseWidth * (isAssistActive(assist, elapsedSec) ? assist.paddleScale : 1);
  if (Math.abs(targetWidth - paddle.width) < 0.001) {
    return;
  }

  const centerX = paddle.x + paddle.width / 2;
  paddle.width = targetWidth;
  paddle.x = clamp(centerX - paddle.width / 2, 0, worldWidth - paddle.width);
}
