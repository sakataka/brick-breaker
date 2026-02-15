import { describe, expect, test } from "bun:test";

import {
  activateAssist,
  applyAssistToPaddle,
  createAssistState,
  getCurrentMaxBallSpeed,
  isAssistActive,
} from "./assistSystem";
import type { Paddle } from "./types";

describe("assistSystem", () => {
  test("creates assist state from config", () => {
    const assist = createAssistState({
      assistPaddleScale: 1.2,
      assistMaxSpeedScale: 0.9,
    });

    expect(assist.untilSec).toBe(0);
    expect(assist.paddleScale).toBe(1.2);
    expect(assist.maxSpeedScale).toBe(0.9);
  });

  test("activateAssist updates active window", () => {
    const assist = createAssistState({
      assistPaddleScale: 1.1,
      assistMaxSpeedScale: 0.95,
    });

    activateAssist(assist, 10, { assistDurationSec: 3.5 });

    expect(assist.untilSec).toBe(13.5);
    expect(isAssistActive(assist, 13.49)).toBe(true);
    expect(isAssistActive(assist, 13.5)).toBe(false);
  });

  test("getCurrentMaxBallSpeed applies scale only while active", () => {
    const assist = createAssistState({
      assistPaddleScale: 1.1,
      assistMaxSpeedScale: 0.8,
    });
    activateAssist(assist, 0, { assistDurationSec: 2 });

    expect(getCurrentMaxBallSpeed(500, assist, 1)).toBe(400);
    expect(getCurrentMaxBallSpeed(500, assist, 2)).toBe(500);
  });

  test("applyAssistToPaddle expands width and clamps position while active", () => {
    const paddle: Paddle = { x: 240, y: 0, width: 120, height: 16 };
    const assist = createAssistState({
      assistPaddleScale: 1.5,
      assistMaxSpeedScale: 0.9,
    });
    activateAssist(assist, 0, { assistDurationSec: 5 });

    applyAssistToPaddle(paddle, 120, 320, assist, 1);
    expect(paddle.width).toBe(180);
    expect(paddle.x).toBe(140);
  });
});
