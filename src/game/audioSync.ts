import type { AudioPort } from "../core/ports";
import { resolveStageMetadataFromState } from "./stageContext";
import type { GameState, Scene } from "./types";

export function syncAudioScene(
  audioDirector: Pick<AudioPort, "notifyStageChanged" | "syncScene">,
  previousScene: Scene,
  nextScene: Scene,
  state: Pick<GameState, "run">,
): void {
  if (previousScene === nextScene) {
    return;
  }
  audioDirector.notifyStageChanged(resolveStageMetadataFromState(state).musicCue);
  audioDirector.syncScene(nextScene, previousScene);
}
