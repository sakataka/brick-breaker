import type { GameState, MetaProgress, OverlayViewModel } from "../public";
import { getCourseBestScore } from "./projectionHelpers";
import { createVisualState } from "./visualProjector";

export function projectOverlayView(state: GameState, meta: MetaProgress): OverlayViewModel {
  const courseBest = getCourseBestScore(state, meta);
  return {
    scene: state.scene,
    score: state.run.score,
    lives: state.run.lives,
    stage: {
      current: state.run.progress.currentStageNumber,
      total: state.run.progress.totalEncounters,
    },
    visual: createVisualState(state),
    record: {
      overallBestScore: meta.records.overallBestScore,
      courseBestScore: courseBest,
      latestRunScore: meta.records.latestRunScore,
      deltaToBest: state.run.score - courseBest,
      currentRunRecord: state.run.score >= courseBest && state.run.score > 0,
    },
    clearElapsedSec: state.scene === "clear" ? state.run.elapsedSec : undefined,
    error: state.ui.overlayError,
    stageResult:
      state.scene === "stageclear"
        ? state.run.stageResults[state.run.stageResults.length - 1]
        : undefined,
    campaignResults: state.scene === "clear" ? state.run.stageResults : undefined,
  };
}
