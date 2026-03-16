import type { CoreEngine } from "../../core/engine";
import type { AudioPort } from "../../core/ports";
import { buildStartConfig } from "../config";
import {
  applyRunScoreToMeta,
  type MetaProgress,
  readMetaProgress,
  shouldUnlockThreatTier2,
  writeMetaProgress,
} from "../metaProgress";
import { advanceStage, prepareStageStory, resetRoundState } from "../roundSystem";
import { syncRecordStateFromMeta } from "../scoreSystem";
import type { SceneEvent } from "../sceneMachine";
import type {
  GameAudioSettings,
  GameConfig,
  GameState,
  RandomSource,
  RuntimeErrorKey,
  Scene,
} from "../types";
import { applyStartSettingsToState, computeAppliedStartSettings } from "./startSettings";

export interface SessionTransitionResult {
  previous: Scene;
  next: Scene;
  changed: boolean;
}

export interface SessionStartSettingsResult {
  config: GameConfig;
  random: RandomSource;
  audioSettings: GameAudioSettings;
  pendingStartStageIndex: number;
}

interface SessionFlowBase {
  state: GameState;
  config: GameConfig;
  random: RandomSource;
  audioPort: AudioPort;
  transition: (event: SceneEvent) => SessionTransitionResult;
  syncAudioForTransition: (result: SessionTransitionResult) => void;
  syncViewPorts: () => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export interface StartOrResumeParams extends SessionFlowBase {
  engine: CoreEngine;
  pendingStartStageIndex: number;
}

export function resolveSessionStartSettings(
  state: GameState,
  baseConfig: GameConfig,
  baseRandom: RandomSource,
  selected: Parameters<typeof applyStartSettingsToState>[1],
): SessionStartSettingsResult {
  const applied = computeAppliedStartSettings(baseConfig, baseRandom, selected, buildStartConfig);
  applyStartSettingsToState(state, selected);
  return applied;
}

export function startOrResumeSession(params: StartOrResumeParams): void {
  void params.audioPort.unlock().catch(() => {});
  if (params.state.scene === "clear") {
    const result = params.transition({ type: "BACK_TO_START" });
    params.syncAudioForTransition(result);
    params.syncViewPorts();
    return;
  }

  if (params.state.scene === "stageclear") {
    advanceStage(params.state, params.config, params.random);
    if (prepareStageStory(params.state)) {
      const storyResult = params.transition({ type: "SHOW_STORY" });
      params.syncAudioForTransition(storyResult);
      params.syncViewPorts();
      return;
    }
  }

  const result = params.transition({ type: "START_OR_RESUME" });
  if (result.next !== "playing") {
    params.syncAudioForTransition(result);
    params.syncViewPorts();
    return;
  }

  if (result.previous === "start") {
    resetRoundState(params.state, params.config, params.state.ui.vfx.reducedMotion, params.random, {
      startStageIndex: params.pendingStartStageIndex,
    });
    params.state.encounter.story.activeStageNumber = null;
  } else if (result.previous === "story") {
    params.state.encounter.story.activeStageNumber = null;
  }

  params.engine.resetClock();
  params.syncAudioForTransition(result);
  params.syncViewPorts();
}

export function handleStageClearSession(
  params: SessionFlowBase & {
    engine: CoreEngine;
    windowRef: Window;
  },
): void {
  let transitionResult: SessionTransitionResult | null = null;
  let reachedClear = false;
  params.engine.applyStageClear((event) => {
    reachedClear = event === "GAME_CLEAR";
    transitionResult = params.transition({ type: event });
  });
  if (reachedClear) {
    let nextMeta = readMetaProgress(params.windowRef.localStorage);
    if (
      reachedClear &&
      shouldUnlockThreatTier2({
        scene: params.state.scene,
        options: { threatTier: params.state.run.options.threatTier },
      })
    ) {
      nextMeta = {
        ...nextMeta,
        progression: {
          ...nextMeta.progression,
          threatTier2Unlocked: true,
        },
      };
    }
    if (shouldPersistRunScore(params.state)) {
      nextMeta = applyRunScoreToMeta(nextMeta, {
        score: params.state.run.score,
        threatTier: params.state.run.options.threatTier,
      });
    }
    writeMetaProgress(params.windowRef.localStorage, nextMeta);
    params.setMetaProgress(nextMeta);
    syncRecordStateFromMeta(params.state, nextMeta);
  }
  if (transitionResult) {
    params.syncAudioForTransition(transitionResult);
  }
  params.syncViewPorts();
}

export function handleBallLossSession(
  params: SessionFlowBase & {
    engine: CoreEngine;
    windowRef: Window;
  },
): void {
  params.engine.applyBallLoss(() => {
    if (shouldPersistRunScore(params.state)) {
      const nextMeta = applyRunScoreToMeta(readMetaProgress(params.windowRef.localStorage), {
        score: params.state.run.lastGameOverScore ?? params.state.run.score,
        threatTier: params.state.run.options.threatTier,
      });
      writeMetaProgress(params.windowRef.localStorage, nextMeta);
      params.setMetaProgress(nextMeta);
      syncRecordStateFromMeta(params.state, nextMeta);
    }
    const result = params.transition({ type: "GAME_OVER" });
    params.syncAudioForTransition(result);
  });
  params.syncViewPorts();
}

export function runSafely(
  action: () => void,
  onError: (key: RuntimeErrorKey, detail?: string) => void,
  key: RuntimeErrorKey,
): void {
  try {
    action();
  } catch (error) {
    onError(key, error instanceof Error && error.message ? error.message : undefined);
  }
}

function shouldPersistRunScore(state: GameState): boolean {
  void state;
  return true;
}
