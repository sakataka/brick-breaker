import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import { DEFAULT_META_PROGRESS, type MetaProgress, writeMetaProgress } from "../metaProgress";
import { createInitialGameState } from "../stateFactory";
import { SessionProgressStore } from "./sessionProgressStore";

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

describe("session/SessionProgressStore", () => {
  test("hydrateRecords syncs stored records into runtime state", () => {
    const storage = new MemoryStorage();
    const seen: MetaProgress[] = [];
    const meta: MetaProgress = {
      progression: { threatTier2Unlocked: true },
      records: {
        overallBestScore: 1500,
        tier1BestScore: 1200,
        tier2BestScore: 1400,
        latestRunScore: 900,
      },
    };
    writeMetaProgress(storage, meta);

    const store = new SessionProgressStore({
      storage,
      setMetaProgress: (next) => seen.push(next),
    });
    const state = createInitialGameState(GAME_CONFIG, false, "start");

    store.hydrateRecords(state);

    expect(seen).toEqual([]);
    expect(state.run.records.overallBestScore).toBe(1500);
    expect(state.run.records.tier1BestScore).toBe(1200);
    expect(state.run.records.tier2BestScore).toBe(1400);
    expect(state.run.records.latestRunScore).toBe(900);
  });

  test("persistClear unlocks threat tier 2 and stores run score", () => {
    const storage = new MemoryStorage();
    const seen: MetaProgress[] = [];
    const store = new SessionProgressStore({
      storage,
      setMetaProgress: (next) => seen.push(next),
    });
    const state = createInitialGameState(GAME_CONFIG, false, "clear");
    state.scene = "clear";
    state.run.options.threatTier = 1;
    state.run.score = 4321;

    store.persistClear(state);

    expect(seen.at(-1)).toEqual({
      progression: { threatTier2Unlocked: true },
      records: {
        ...DEFAULT_META_PROGRESS.records,
        overallBestScore: 4321,
        tier1BestScore: 4321,
        latestRunScore: 4321,
      },
    });
    expect(state.run.records.overallBestScore).toBe(4321);
    expect(state.run.records.tier1BestScore).toBe(4321);
  });

  test("persistGameOver uses last game over score when available", () => {
    const storage = new MemoryStorage();
    const seen: MetaProgress[] = [];
    const store = new SessionProgressStore({
      storage,
      setMetaProgress: (next) => seen.push(next),
    });
    const state = createInitialGameState(GAME_CONFIG, false, "gameover");
    state.scene = "gameover";
    state.run.options.threatTier = 2;
    state.run.score = 100;
    state.run.lastGameOverScore = 9876;

    store.persistGameOver(state);

    expect(seen.at(-1)?.records.latestRunScore).toBe(9876);
    expect(seen.at(-1)?.records.tier2BestScore).toBe(9876);
    expect(state.run.records.latestRunScore).toBe(9876);
    expect(state.run.records.tier2BestScore).toBe(9876);
  });
});
