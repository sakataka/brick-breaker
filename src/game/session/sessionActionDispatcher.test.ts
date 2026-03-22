import { describe, expect, test } from "vite-plus/test";
import type { CoreEngine } from "../../core/engine";
import type { AudioPort } from "../../core/ports";
import { GAME_CONFIG } from "../config";
import { createInitialGameState } from "../stateFactory";
import type { GameState } from "../types";
import { SessionActionDispatcher } from "./sessionActionDispatcher";
import type { SessionTransitionResult } from "./sessionFlow";
import type { SessionProgressStore } from "./sessionProgressStore";

function createAudioPortStub() {
  return {
    unlockCalls: 0,
    unlock() {
      this.unlockCalls += 1;
      return Promise.resolve();
    },
    setSettings() {},
    syncScene() {},
    notifyStageChanged() {},
    playItemPickup() {},
    playComboFill() {},
    playMagicCast() {},
    playBossCast() {},
    playBossPhaseShift() {},
    playDangerLane() {},
    destroy() {},
  } as AudioPort & { unlockCalls: number };
}

describe("session/SessionActionDispatcher", () => {
  test("togglePause unlocks audio, resets clock on resume, and republishes", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "paused");
    state.scene = "paused";
    const audioPort = createAudioPortStub();
    const calls = {
      resetClock: 0,
      syncAudio: [] as SessionTransitionResult[],
      publish: 0,
    };

    const dispatcher = new SessionActionDispatcher({
      state,
      engine: {
        resetClock: () => {
          calls.resetClock += 1;
        },
      } as CoreEngine,
      audioPort,
      progressStore: {} as SessionProgressStore,
      transition: () => ({ previous: "paused", next: "playing", changed: true }),
      syncAudioForTransition: (result) => {
        calls.syncAudio.push(result);
      },
      publishState: () => {
        calls.publish += 1;
      },
    });

    dispatcher.togglePause();

    expect(audioPort.unlockCalls).toBe(1);
    expect(calls.resetClock).toBe(1);
    expect(calls.syncAudio).toEqual([{ previous: "paused", next: "playing", changed: true }]);
    expect(calls.publish).toBe(1);
  });

  test("handleStageClear persists clear results only on GAME_CLEAR", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    state.scene = "playing";
    const persisted: GameState[] = [];
    const audioSync: SessionTransitionResult[] = [];
    let publishCount = 0;

    const dispatcher = new SessionActionDispatcher({
      state,
      engine: {
        applyStageClear: (onTransition: (event: "STAGE_CLEAR" | "GAME_CLEAR") => void) => {
          state.scene = "clear";
          onTransition("GAME_CLEAR");
        },
      } as CoreEngine,
      audioPort: createAudioPortStub(),
      progressStore: {
        persistClear: (nextState: GameState) => {
          persisted.push(nextState);
        },
      } as SessionProgressStore,
      transition: () => ({ previous: "playing", next: "clear", changed: true }),
      syncAudioForTransition: (result) => {
        audioSync.push(result);
      },
      publishState: () => {
        publishCount += 1;
      },
    });

    dispatcher.handleStageClear();

    expect(persisted).toEqual([state]);
    expect(audioSync).toEqual([{ previous: "playing", next: "clear", changed: true }]);
    expect(publishCount).toBe(1);
  });
});
