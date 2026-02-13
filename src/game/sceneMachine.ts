import { createActor, createMachine } from "xstate";
import type { Scene } from "./types";

export type SceneEvent =
  | { type: "START_OR_RESUME" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "GAME_OVER" }
  | { type: "GAME_CLEAR" }
  | { type: "RUNTIME_ERROR" }
  | { type: "RESET" };

const sceneMachineDefinition = createMachine({
  id: "brick-breaker-scene",
  initial: "start",
  states: {
    start: {
      on: {
        START_OR_RESUME: "playing",
        RUNTIME_ERROR: "error",
      },
    },
    playing: {
      on: {
        TOGGLE_PAUSE: "paused",
        GAME_CLEAR: "clear",
        GAME_OVER: "gameover",
        RUNTIME_ERROR: "error",
      },
    },
    paused: {
      on: {
        TOGGLE_PAUSE: "playing",
        START_OR_RESUME: "playing",
        RUNTIME_ERROR: "error",
      },
    },
    gameover: {
      on: {
        START_OR_RESUME: "playing",
        RUNTIME_ERROR: "error",
      },
    },
    clear: {
      on: {
        START_OR_RESUME: "playing",
        RUNTIME_ERROR: "error",
      },
    },
    error: {
      on: {
        RESET: "start",
      },
    },
  },
});

export class SceneMachine {
  private readonly actor = createActor(sceneMachineDefinition);

  constructor() {
    this.actor.start();
  }

  get value(): Scene {
    return this.actor.getSnapshot().value as Scene;
  }

  send(event: SceneEvent): Scene {
    this.actor.send(event);
    return this.value;
  }

  stop(): void {
    this.actor.stop();
  }
}
