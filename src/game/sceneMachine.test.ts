import { describe, expect, test } from "bun:test";

import { SceneMachine } from "./sceneMachine";

describe("sceneMachine", () => {
  test("supports start -> playing -> paused -> playing", () => {
    const machine = new SceneMachine();
    expect(machine.value).toBe("start");
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    expect(machine.send({ type: "TOGGLE_PAUSE" })).toBe("paused");
    expect(machine.send({ type: "TOGGLE_PAUSE" })).toBe("playing");
    machine.stop();
  });

  test("does not resume from error with start event", () => {
    const machine = new SceneMachine();
    expect(machine.send({ type: "RUNTIME_ERROR" })).toBe("error");
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("error");
    machine.stop();
  });

  test("supports playing -> stageclear -> playing", () => {
    const machine = new SceneMachine();
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    expect(machine.send({ type: "STAGE_CLEAR" })).toBe("stageclear");
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    machine.stop();
  });

  test("supports stageclear -> story -> playing", () => {
    const machine = new SceneMachine();
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    expect(machine.send({ type: "STAGE_CLEAR" })).toBe("stageclear");
    expect(machine.send({ type: "SHOW_STORY" })).toBe("story");
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    machine.stop();
  });

  test("moves stageclear to error on runtime error", () => {
    const machine = new SceneMachine();
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    expect(machine.send({ type: "STAGE_CLEAR" })).toBe("stageclear");
    expect(machine.send({ type: "RUNTIME_ERROR" })).toBe("error");
    machine.stop();
  });

  test("supports clear -> start transition", () => {
    const machine = new SceneMachine();
    expect(machine.send({ type: "START_OR_RESUME" })).toBe("playing");
    expect(machine.send({ type: "GAME_CLEAR" })).toBe("clear");
    expect(machine.send({ type: "BACK_TO_START" })).toBe("start");
    machine.stop();
  });
});
