import type { AudioDirector } from "../audio/audioDirector";
import type { Scene } from "./types";

export function syncAudioScene(
  audioDirector: AudioDirector,
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
