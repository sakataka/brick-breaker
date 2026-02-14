import { createActor, createMachine } from "xstate";
import type { Scene } from "./types";

export const SceneTransitionInput = {
  START_OR_RESUME: "START_OR_RESUME",
  TOGGLE_PAUSE: "TOGGLE_PAUSE",
  STAGE_CLEAR: "STAGE_CLEAR",
  GAME_OVER: "GAME_OVER",
  GAME_CLEAR: "GAME_CLEAR",
  BACK_TO_START: "BACK_TO_START",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  RESET: "RESET",
} as const;

export type SceneTransitionInput = (typeof SceneTransitionInput)[keyof typeof SceneTransitionInput];
export type SceneEvent = { type: SceneTransitionInput };

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
        STAGE_CLEAR: "stageclear",
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
        BACK_TO_START: "start",
        RUNTIME_ERROR: "error",
      },
    },
    stageclear: {
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
