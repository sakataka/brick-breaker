import type { CoreEngine } from "../../core/engine";
import type { MusicCue } from "../../core/model";
import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import type { MetaProgress } from "../metaProgress";
import { readMetaProgress } from "../metaProgress";
import { SceneMachine } from "../sceneMachine";
import { createInitialGameState } from "../stateFactory";
import type { SessionPorts } from "./SessionPorts";
import { SessionTestBridge } from "./sessionTestBridge";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createPortsStub() {
  const syncedScenes: Array<{ previous: string; next: string }> = [];
  const stageChanges: MusicCue[] = [];
  const metaProgress: MetaProgress[] = [];

  return {
    syncedScenes,
    stageChanges,
    metaProgress,
    syncAudioScene(previous: string, next: string) {
      syncedScenes.push({ previous, next });
    },
    setMetaProgress(next: MetaProgress) {
      metaProgress.push(next);
    },
    audio: {
      notifyStageChanged(cue: MusicCue) {
        stageChanges.push(cue);
      },
    },
  } as unknown as SessionPorts & {
    syncedScenes: Array<{ previous: string; next: string }>;
    stageChanges: MusicCue[];
    metaProgress: MetaProgress[];
  };
}

describe("session/SessionTestBridge", () => {
  test("forceScene and setGameOverScore delegate through runtime test support", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    const sceneMachine = new SceneMachine();
    const ports = createPortsStub();
    let publishCount = 0;

    const bridge = new SessionTestBridge({
      state,
      sceneMachine,
      windowRef: { localStorage: new MemoryStorage() } as unknown as Window,
      ports,
      engine: { resetClock() {} } as unknown as CoreEngine,
      getConfig: () => GAME_CONFIG,
      getRandom: () => ({ next: () => 0.5 }),
      publishState: () => {
        publishCount += 1;
      },
    });

    bridge.forceScene("paused");
    bridge.setGameOverScore(4321, 1);

    expect(state.scene).toBe("gameover");
    expect(state.run.lastGameOverScore).toBe(4321);
    expect(state.run.lives).toBe(1);
    expect(ports.syncedScenes).toEqual([
      { previous: "start", next: "paused" },
      { previous: "paused", next: "gameover" },
    ]);
    expect(publishCount).toBe(2);
  });

  test("unlockThreatTier2 and loadScenario use bridge-owned getters and ports", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "start");
    const sceneMachine = new SceneMachine();
    const storage = new MemoryStorage();
    const ports = createPortsStub();
    let publishCount = 0;
    let resetClockCount = 0;

    const bridge = new SessionTestBridge({
      state,
      sceneMachine,
      windowRef: { localStorage: storage } as unknown as Window,
      ports,
      engine: {
        resetClock() {
          resetClockCount += 1;
        },
      } as unknown as CoreEngine,
      getConfig: () => GAME_CONFIG,
      getRandom: () => ({ next: () => 0.25 }),
      publishState: () => {
        publishCount += 1;
      },
    });

    bridge.unlockThreatTier2();
    bridge.loadScenario("pickup_toast");

    expect(readMetaProgress(storage).progression.threatTier2Unlocked).toBe(true);
    expect(ports.metaProgress.at(-1)?.progression.threatTier2Unlocked).toBe(true);
    expect(state.scene).toBe("playing");
    expect(resetClockCount).toBe(1);
    expect(ports.stageChanges.length).toBe(1);
    expect(publishCount).toBe(2);
  });
});
