import type { AudioPort } from "../core/ports";
import type { Scene } from "./types";

export function syncAudioScene(
  audioDirector: Pick<AudioPort, "notifyStageChanged" | "syncScene">,
  previousScene: Scene,
  nextScene: Scene,
  stageIndex: number,
): void {
  if (previousScene === nextScene) {
    return;
  }
  audioDirector.notifyStageChanged(stageIndex);
  audioDirector.syncScene(nextScene, previousScene);
}
