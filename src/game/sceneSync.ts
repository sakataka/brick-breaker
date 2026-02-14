import type { SceneEvent, SceneMachine } from "./sceneMachine";
import type { GameState, Scene } from "./types";

export interface SceneTransitionResult {
  previous: Scene;
  next: Scene;
  changed: boolean;
}

export function applySceneTransition(
  state: Pick<GameState, "scene">,
  sceneMachine: SceneMachine,
  event: SceneEvent,
): SceneTransitionResult {
  const previous = state.scene;
  const next = sceneMachine.send(event);
  if (next !== previous) {
    state.scene = next;
  }
  return {
    previous,
    next,
    changed: next !== previous,
  };
}
