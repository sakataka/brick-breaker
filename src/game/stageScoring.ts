import { getStageTimeTargetSec, MISSION_CONFIG, RATING_CONFIG } from "./config";
import { resolveStageMetadataFromState } from "./stageContext";
import type { GameState } from "./types";

export function finalizeStageStats(state: GameState, persistResult = true): void {
  const clearTimeSec = Math.max(0, state.run.elapsedSec - state.encounter.stats.startedAtSec);
  const ratingScore = computeStageRatingScore(state, clearTimeSec);
  const missionTargetSec = getStageTimeTargetSec(state.run.progress.encounterIndex);
  const missionResults = buildStageMissionResults(state, clearTimeSec, missionTargetSec);
  const missionAchieved = missionResults.every((mission) => mission.achieved);
  const missionBonusStars = missionAchieved ? MISSION_CONFIG.bonusStarsOnAllClear : 0;
  const stars = Math.min(3, getStarRatingByScore(ratingScore) + missionBonusStars) as 1 | 2 | 3;
  state.encounter.stats.clearedAtSec = state.run.elapsedSec;
  state.encounter.stats.ratingScore = ratingScore;
  state.encounter.stats.starRating = stars;
  state.encounter.stats.missionTargetSec = missionTargetSec;
  state.encounter.stats.missionAchieved = missionAchieved;
  state.encounter.stats.missionResults = missionResults;
  if (persistResult) {
    upsertCampaignStageResult(
      state,
      clearTimeSec,
      stars,
      ratingScore,
      missionTargetSec,
      missionAchieved,
      missionResults,
    );
  }
}

export function getStageClearTimeSec(state: GameState): number | null {
  if (typeof state.encounter.stats.clearedAtSec !== "number") {
    return null;
  }
  return Math.max(0, state.encounter.stats.clearedAtSec - state.encounter.stats.startedAtSec);
}

export function getStarRatingByScore(score: number): 1 | 2 | 3 {
  if (score >= RATING_CONFIG.star3Min) {
    return 3;
  }
  if (score >= RATING_CONFIG.star2Min) {
    return 2;
  }
  return 1;
}

function computeStageRatingScore(state: GameState, clearTimeSec: number): number {
  const targetSec = getStageTimeTargetSec(state.run.progress.encounterIndex);
  const safeClearSec = Math.max(1, clearTimeSec);
  const timeScore = Math.max(
    0,
    Math.min(
      RATING_CONFIG.timeScoreMax,
      (targetSec / Math.max(targetSec, safeClearSec)) * RATING_CONFIG.timeScoreMax,
    ),
  );
  const hitScore = Math.max(
    0,
    RATING_CONFIG.hitScoreMax - state.encounter.stats.hitsTaken * RATING_CONFIG.hitPenalty,
  );
  const lifeScore = Math.max(
    0,
    Math.min(RATING_CONFIG.lifeScoreMax, state.run.lives * RATING_CONFIG.lifeScorePerLife),
  );
  return Math.round(timeScore + hitScore + lifeScore);
}

function upsertCampaignStageResult(
  state: GameState,
  clearTimeSec: number,
  stars: 1 | 2 | 3,
  ratingScore: number,
  missionTargetSec: number,
  missionAchieved: boolean,
  missionResults: GameState["encounter"]["stats"]["missionResults"],
): void {
  const stageNumber = state.run.progress.encounterIndex + 1;
  const entry = {
    stageNumber,
    clearTimeSec,
    stars,
    ratingScore,
    livesAtClear: state.run.lives,
    missionTargetSec,
    missionAchieved,
    missionResults: missionResults ?? [],
  };
  const existing = state.run.progress.results.findIndex(
    (result) => result.stageNumber === stageNumber,
  );
  if (existing >= 0) {
    state.run.progress.results[existing] = entry;
    return;
  }
  state.run.progress.results.push(entry);
  state.run.progress.results.sort((a, b) => a.stageNumber - b.stageNumber);
}

function buildStageMissionResults(
  state: GameState,
  clearTimeSec: number,
  missionTargetSec: number,
): NonNullable<GameState["encounter"]["stats"]["missionResults"]> {
  const stage = resolveStageMetadataFromState(state).stage;
  const missions = stage.missions ?? ["time_limit", "no_shop"];
  return missions.map((mission) => {
    switch (mission) {
      case "time_limit":
        return {
          key: mission,
          targetSec: Math.round(missionTargetSec),
          achieved: clearTimeSec <= missionTargetSec,
        };
      case "no_shop":
        return { key: mission, achieved: !state.encounter.shop.usedThisStage };
      case "no_miss_stage":
        return { key: mission, achieved: state.encounter.stats.hitsTaken <= 0 };
      case "combo_x2":
        return {
          key: mission,
          achieved: state.run.combo.rewardGranted || state.run.combo.multiplier >= 2,
        };
      case "destroy_turret_first":
        return { key: mission, achieved: state.encounter.stats.firstDestroyedKind === "turret" };
      case "shutdown_generator":
        return {
          key: mission,
          achieved: (state.encounter.stats.generatorShutdown ?? false) === true,
        };
      default:
        return { key: mission, achieved: false };
    }
  });
}
