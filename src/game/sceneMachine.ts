import type { Scene } from "./types";

export const SceneTransitionInput = {
  START_OR_RESUME: "START_OR_RESUME",
  SHOW_STORY: "SHOW_STORY",
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

const TRANSITIONS: Record<Scene, Partial<Record<SceneTransitionInput, Scene>>> = {
  start: {
    START_OR_RESUME: "playing",
    RUNTIME_ERROR: "error",
  },
  story: {
    START_OR_RESUME: "playing",
    RUNTIME_ERROR: "error",
  },
  playing: {
    TOGGLE_PAUSE: "paused",
    STAGE_CLEAR: "stageclear",
    GAME_CLEAR: "clear",
    GAME_OVER: "gameover",
    RUNTIME_ERROR: "error",
  },
  paused: {
    TOGGLE_PAUSE: "playing",
    START_OR_RESUME: "playing",
    RUNTIME_ERROR: "error",
  },
  gameover: {
    START_OR_RESUME: "playing",
    RUNTIME_ERROR: "error",
  },
  clear: {
    START_OR_RESUME: "playing",
    BACK_TO_START: "start",
    RUNTIME_ERROR: "error",
  },
  stageclear: {
    SHOW_STORY: "story",
    START_OR_RESUME: "playing",
    RUNTIME_ERROR: "error",
  },
  error: {
    RESET: "start",
  },
};

function transitionScene(current: Scene, event: SceneEvent): Scene {
  return TRANSITIONS[current][event.type] ?? current;
}

export class SceneMachine {
  constructor(private current: Scene = "start") {}

  get value(): Scene {
    return this.current;
  }

  send(event: SceneEvent): Scene {
    this.current = transitionScene(this.current, event);
    return this.current;
  }

  force(scene: Scene): void {
    this.current = scene;
  }

  stop(): void {}
}
