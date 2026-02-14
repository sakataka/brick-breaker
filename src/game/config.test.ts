import { describe, expect, test } from "bun:test";

import { buildStartConfig, GAME_CONFIG, getGameplayBalance } from "./config";

describe("config helpers", () => {
  test("buildStartConfig applies difficulty and speed only to ball speed", () => {
    const config = buildStartConfig(GAME_CONFIG, {
      difficulty: "hard",
      initialLives: 5,
      speedPreset: "1.25",
    });

    expect(config.difficulty).toBe("hard");
    expect(config.initialLives).toBe(5);
    expect(config.initialBallSpeed).toBeCloseTo(425, 5);
    expect(config.maxBallSpeed).toBeCloseTo(850, 5);
  });

  test("getGameplayBalance returns difficulty specific paddle width", () => {
    const casual = getGameplayBalance("casual");
    const hard = getGameplayBalance("hard");
    expect(casual.paddleWidth).toBeGreaterThan(hard.paddleWidth);
  });
});
