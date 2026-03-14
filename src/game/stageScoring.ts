import { getStageTimeTargetSec, MISSION_CONFIG, RATING_CONFIG } from "./config";
import { resolveStageMetadataFromState } from "./stageContext";
import type { GameState } from "./types";

export function finalizeStageStats(state: GameState, persistResult = true): void {
  const clearTimeSec = Math.max(0, state.elapsedSec - state.stageStats.startedAtSec);
  const ratingScore = computeStageRatingScore(state, clearTimeSec);
  const missionTargetSec = getStageTimeTargetSec(state.campaign.stageIndex);
  const missionResults = buildStageMissionResults(state, clearTimeSec, missionTargetSec);
  const missionAchieved = missionResults.every((mission) => mission.achieved);
  const missionBonusStars = missionAchieved ? MISSION_CONFIG.bonusStarsOnAllClear : 0;
  const stars = Math.min(3, getStarRatingByScore(ratingScore) + missionBonusStars) as 1 | 2 | 3;
  state.stageStats.clearedAtSec = state.elapsedSec;
  state.stageStats.ratingScore = ratingScore;
  state.stageStats.starRating = stars;
  state.stageStats.missionTargetSec = missionTargetSec;
  state.stageStats.missionAchieved = missionAchieved;
  state.stageStats.missionResults = missionResults;
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
  if (typeof state.stageStats.clearedAtSec !== "number") {
    return null;
  }
  return Math.max(0, state.stageStats.clearedAtSec - state.stageStats.startedAtSec);
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
  const targetSec = getStageTimeTargetSec(state.campaign.stageIndex);
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
    RATING_CONFIG.hitScoreMax - state.stageStats.hitsTaken * RATING_CONFIG.hitPenalty,
  );
  const lifeScore = Math.max(
    0,
    Math.min(RATING_CONFIG.lifeScoreMax, state.lives * RATING_CONFIG.lifeScorePerLife),
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
  missionResults: GameState["stageStats"]["missionResults"],
): void {
  const stageNumber = state.campaign.stageIndex + 1;
  const entry = {
    stageNumber,
    clearTimeSec,
    stars,
    ratingScore,
    livesAtClear: state.lives,
    missionTargetSec,
    missionAchieved,
    missionResults: missionResults ?? [],
  };
  const existing = state.campaign.results.findIndex((result) => result.stageNumber === stageNumber);
  if (existing >= 0) {
    state.campaign.results[existing] = entry;
    return;
  }
  state.campaign.results.push(entry);
  state.campaign.results.sort((a, b) => a.stageNumber - b.stageNumber);
}

function buildStageMissionResults(
  state: GameState,
  clearTimeSec: number,
  missionTargetSec: number,
): NonNullable<GameState["stageStats"]["missionResults"]> {
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
        return { key: mission, achieved: !state.shop.usedThisStage };
      case "no_miss_stage":
        return { key: mission, achieved: state.stageStats.hitsTaken <= 0 };
      case "combo_x2":
        return { key: mission, achieved: state.combo.rewardGranted || state.combo.multiplier >= 2 };
      case "destroy_turret_first":
        return { key: mission, achieved: state.stageStats.firstDestroyedKind === "turret" };
      case "shutdown_generator":
        return { key: mission, achieved: (state.stageStats.generatorShutdown ?? false) === true };
      default:
        return { key: mission, achieved: false };
    }
  });
}
