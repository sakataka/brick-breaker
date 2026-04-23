import { getPublicEncounterCatalog } from "../content";
import { applyRunScoreToMeta, writeMetaProgress, type MetaProgress } from "../public/metaProgress";
import type { GameConfig, GameState, StageMissionStatus } from "../public/types";
import type { StartSettingsSelection } from "../public/startSettings";
import { buildShopOffer } from "./shop";
import {
  createCombatState,
  createEncounterState,
  createInitialGameState,
  getStageModifier,
} from "./stateFactory";

function createMissionResults(): StageMissionStatus[] {
  return [
    { key: "time_limit", achieved: true },
    { key: "no_shop", achieved: true },
  ];
}

export function prepareEncounter(state: GameState): void {
  state.encounter.shop.lastOffer = {
    options: buildShopOffer(state.encounter.stageNumber),
    cost: 1200,
  };
}

export function createStartedRunState(
  config: GameConfig,
  settings: StartSettingsSelection,
): GameState {
  const state = createInitialGameState(
    config,
    settings.reducedMotionEnabled,
    "playing",
    settings.highContrastEnabled,
  );
  prepareEncounter(state);
  return state;
}

export function createTitleState(config: GameConfig, settings: StartSettingsSelection): GameState {
  return createInitialGameState(
    config,
    settings.reducedMotionEnabled,
    "start",
    settings.highContrastEnabled,
  );
}

export function pausePlaying(state: GameState): boolean {
  if (state.scene !== "playing") {
    return false;
  }
  state.scene = "paused";
  return true;
}

export function resumePaused(state: GameState): boolean {
  if (state.scene !== "paused") {
    return false;
  }
  state.scene = "playing";
  return true;
}

export function setGameOverScore(state: GameState, score: number, lives = 0): void {
  state.run.score = Math.max(0, Math.round(score));
  state.run.lives = Math.max(0, Math.round(lives));
  state.scene = "gameover";
}

export function advanceEncounter(state: GameState, config: GameConfig): boolean {
  const encounters = getPublicEncounterCatalog(state.run.threatTier);
  const nextIndex = state.run.progress.currentEncounterIndex + 1;
  if (nextIndex >= encounters.length) {
    state.scene = "clear";
    return false;
  }
  const next = encounters[nextIndex];
  const persistedRun = state.run;
  state.scene = "playing";
  state.run = {
    ...persistedRun,
    progress: {
      currentEncounterIndex: nextIndex,
      totalEncounters: encounters.length,
      currentStageNumber: next.stageNumber,
    },
  };
  state.encounter = {
    ...createEncounterState(next),
    modifierKey: getStageModifier(next.threatTier, next.stageNumber).key,
  };
  state.combat = createCombatState(config, next);
  state.ui.warningLevel = "calm";
  prepareEncounter(state);
  return true;
}

function completeStage(state: GameState): void {
  const stageNumber = state.encounter.stageNumber;
  const clearTimeSec = Math.max(1, Math.round(state.encounter.elapsedSec));
  const ratingScore = Math.max(55, Math.min(100, 100 - clearTimeSec + state.run.lives * 5));
  const stageResult = {
    stageNumber,
    stars: ratingScore >= 80 ? 3 : ratingScore >= 55 ? 2 : 1,
    ratingScore,
    clearTimeSec,
    hitsTaken: 0,
    livesLeft: state.run.lives,
    missionTargetSec: 90 + stageNumber * 4,
    missionAchieved: true,
    missionResults: createMissionResults(),
  } as const;
  state.run.stageResults.push(stageResult);
  state.scene = "stageclear";
}

export function completePlayingFrame(
  state: GameState,
  meta: MetaProgress,
  storage: Pick<Storage, "setItem"> | null | undefined,
): MetaProgress | null {
  if (state.scene === "stageclear") {
    completeStage(state);
    return null;
  }
  if (state.scene === "gameover") {
    return finalizeRun(state, meta, storage);
  }
  return null;
}

export function finalizeRun(
  state: GameState,
  meta: MetaProgress,
  storage: Pick<Storage, "setItem"> | null | undefined,
): MetaProgress {
  const next = applyRunScoreToMeta(meta, {
    score: state.run.score,
    threatTier: state.run.threatTier,
  });
  if (state.scene === "clear" && state.run.threatTier === 1) {
    next.progression.threatTier2Unlocked = true;
  }
  writeMetaProgress(storage, next);
  return next;
}
