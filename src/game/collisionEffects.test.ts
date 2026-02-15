import { describe, expect, test } from "bun:test";

import { applyPhysicsResultScore, playCollisionSounds } from "./collisionEffects";
import { GAME_CONFIG } from "./config";
import { createInitialGameState } from "./stateFactory";
import type { CollisionEvent } from "./types";

describe("collisionEffects", () => {
  test("plays each collision sound once per frame by event kind", async () => {
    const played: string[] = [];
    const sfx = {
      play: async (event: string) => {
        played.push(event);
      },
    };
    const events: CollisionEvent[] = [
      { kind: "wall", x: 1, y: 1 },
      { kind: "paddle", x: 2, y: 2 },
      { kind: "brick", x: 3, y: 3 },
      { kind: "brick", x: 4, y: 4 },
      { kind: "miss", x: 5, y: 5 },
    ];

    playCollisionSounds(sfx as never, events);
    await Promise.resolve();

    expect(played).toEqual(["wall", "paddle", "brick", "miss"]);
  });

  test("adds brick score and returns continue when nothing terminal happened", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.score = 200;
    state.lives = 3;
    const outcome = applyPhysicsResultScore(
      state,
      {
        livesLost: 0,
        cleared: false,
        scoreGain: 150,
        events: [],
        collision: { wall: false, paddle: false, brick: 1 },
      },
      500,
    );

    expect(outcome).toBe("continue");
    expect(state.score).toBe(350);
  });

  test("returns lifeLost before clear and does not add clear bonus", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.score = 0;
    state.lives = 2;
    const outcome = applyPhysicsResultScore(
      state,
      {
        livesLost: 1,
        cleared: true,
        scoreGain: 200,
        events: [],
        collision: { wall: false, paddle: false, brick: 2 },
      },
      500,
    );

    expect(outcome).toBe("lifeLost");
    expect(state.score).toBe(200);
  });

  test("returns cleared and adds clear bonus", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.score = 100;
    state.lives = 3;
    const outcome = applyPhysicsResultScore(
      state,
      {
        livesLost: 0,
        cleared: true,
        scoreGain: 0,
        events: [],
        collision: { wall: false, paddle: false, brick: 0 },
      },
      400,
    );

    expect(outcome).toBe("cleared");
    expect(state.score).toBe(1300);
  });
});
