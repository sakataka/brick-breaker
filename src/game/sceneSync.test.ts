import { describe, expect, test } from "bun:test";
import { SceneMachine } from "./sceneMachine";
import { applySceneTransition } from "./sceneSync";
import type { GameState } from "./types";

describe("sceneSync", () => {
  test("applySceneTransition updates state scene when transition occurs", () => {
    const machine = new SceneMachine();
    const state = { scene: "start" } as Pick<GameState, "scene">;

    const result = applySceneTransition(state, machine, { type: "START_OR_RESUME" });

    expect(result).toEqual({
      previous: "start",
      next: "playing",
      changed: true,
    });
    expect(state.scene).toBe("playing");
    machine.stop();
  });

  test("applySceneTransition keeps state scene when transition is ignored", () => {
    const machine = new SceneMachine();
    const state = { scene: "start" } as Pick<GameState, "scene">;

    const result = applySceneTransition(state, machine, { type: "TOGGLE_PAUSE" });

    expect(result).toEqual({
      previous: "start",
      next: "start",
      changed: false,
    });
    expect(state.scene).toBe("start");
    machine.stop();
  });
});
