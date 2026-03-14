import type { CoreEngine } from "../../core/engine";
import type { AudioPort } from "../../core/ports";
import { buildStartConfig } from "../config";
import {
  type MetaProgress,
  readMetaProgress,
  shouldUnlockEx,
  writeMetaProgress,
} from "../metaProgress";
import {
  advanceStage,
  applyRogueUpgradeSelection,
  prepareStageStory,
  resetRoundState,
} from "../roundSystem";
import type { SceneEvent } from "../sceneMachine";
import type {
  GameAudioSettings,
  GameConfig,
  GameState,
  RandomSource,
  RuntimeErrorKey,
  Scene,
} from "../types";
import { prepareGhostPlayback, saveGhostRecording } from "./sessionPersistence";
import {
  applyDebugPresetOnRoundStart,
  applyStartSettingsToState,
  computeAppliedStartSettings,
} from "./startSettings";

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
  windowRef: Window;
  pendingStartStageIndex: number;
  ghostStorageKey: string;
  getRogueSelection: () => GameState["rogue"]["lastChosen"];
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
    if (params.state.rogue.pendingOffer) {
      const selection = params.getRogueSelection();
      if (selection) {
        applyRogueUpgradeSelection(params.state, selection);
      }
    }
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
    resetRoundState(params.state, params.config, params.state.vfx.reducedMotion, params.random, {
      startStageIndex: params.pendingStartStageIndex,
    });
    applyDebugPresetOnRoundStart(params.state, params.random, params.config.multiballMaxBalls);
    prepareGhostPlayback(params.state, params.windowRef.localStorage, params.ghostStorageKey);
  } else if (result.previous === "story") {
    params.state.story.activeStageNumber = null;
  }

  params.engine.resetClock();
  params.syncAudioForTransition(result);
  params.syncViewPorts();
}

export function handleStageClearSession(
  params: SessionFlowBase & {
    engine: CoreEngine;
    windowRef: Window;
    ghostStorageKey: string;
  },
): void {
  let transitionResult: SessionTransitionResult | null = null;
  let reachedClear = false;
  params.engine.applyStageClear((event) => {
    reachedClear = event === "GAME_CLEAR";
    transitionResult = params.transition({ type: event });
  });
  if (reachedClear) {
    saveGhostRecording(params.state, params.windowRef.localStorage, params.ghostStorageKey);
    if (shouldUnlockEx(params.state)) {
      const nextMeta = {
        ...readMetaProgress(params.windowRef.localStorage),
        exUnlocked: true,
      };
      writeMetaProgress(params.windowRef.localStorage, nextMeta);
      params.setMetaProgress(nextMeta);
    }
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
    ghostStorageKey: string;
  },
): void {
  params.engine.applyBallLoss(() => {
    const result = params.transition({ type: "GAME_OVER" });
    params.syncAudioForTransition(result);
  });
  if (params.state.scene === "gameover") {
    saveGhostRecording(params.state, params.windowRef.localStorage, params.ghostStorageKey);
  }
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
