import { getStageStory } from "../config";
import type { OverlayViewModel } from "../renderTypes";
import { getStageClearTimeSec } from "../roundSystem";
import { resolveStageMetadataFromState } from "../stageContext";
import type { GameState } from "../types";
import { buildStageIntro, buildVisualState, resolveWarningLevel } from "./shared";

export function buildOverlayViewModel(state: GameState): OverlayViewModel {
  const stageContext = resolveStageMetadataFromState(state);
  const warningLevel = resolveWarningLevel(state);
  const clearSec = getStageClearTimeSec(state);
  const overlayScore =
    state.scene === "gameover" && typeof state.run.lastGameOverScore === "number"
      ? state.run.lastGameOverScore
      : state.run.score;
  return {
    scene: state.scene,
    score: overlayScore,
    lives: state.run.lives,
    stage: {
      current: state.run.progress.encounterIndex + 1,
      total: state.run.progress.totalEncounters,
    },
    visual: buildVisualState(
      state,
      stageContext,
      warningLevel,
      buildStageIntro(state, stageContext),
    ),
    record: {
      overallBestScore: state.run.records.overallBestScore,
      courseBestScore:
        state.run.options.threatTier === 2
          ? state.run.records.tier2BestScore
          : state.run.records.tier1BestScore,
      latestRunScore: state.run.records.latestRunScore,
      deltaToBest: state.run.records.deltaToBest,
      currentRunRecord: state.run.records.currentRunRecord,
    },
    clearElapsedSec: state.scene === "clear" ? state.run.elapsedSec : undefined,
    error: state.ui.error ?? undefined,
    stageResult:
      typeof state.encounter.stats.starRating === "number" &&
      typeof state.encounter.stats.ratingScore === "number" &&
      clearSec !== null
        ? {
            stars: state.encounter.stats.starRating,
            ratingScore: state.encounter.stats.ratingScore,
            clearTimeSec: clearSec,
            hitsTaken: state.encounter.stats.hitsTaken,
            livesLeft: state.run.lives,
            missionTargetSec: state.encounter.stats.missionTargetSec,
            missionAchieved: state.encounter.stats.missionAchieved ?? false,
            missionResults: state.encounter.stats.missionResults ?? [],
          }
        : undefined,
    campaignResults:
      state.scene === "clear"
        ? state.run.progress.results.map((result) => ({
            stageNumber: result.stageNumber,
            stars: result.stars,
            ratingScore: result.ratingScore,
            clearTimeSec: result.clearTimeSec,
            livesLeft: result.livesAtClear,
            missionTargetSec: result.missionTargetSec,
            missionAchieved: result.missionAchieved,
            missionResults: result.missionResults,
          }))
        : undefined,
    storyStageNumber:
      state.scene === "story" && typeof state.encounter.story.activeStageNumber === "number"
        ? (getStageStory(state.encounter.story.activeStageNumber) ?? undefined)
        : undefined,
  };
}
