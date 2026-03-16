import { describe, expect, test } from "vite-plus/test";
import { syncAudioScene } from "./audioSync";
import type { Scene } from "./types";

describe("audioSync", () => {
  test("syncAudioScene propagates stage and scene changes when scene changes", () => {
    const events: Array<{ kind: "stage" | "scene"; payload: unknown }> = [];
    const audio = {
      notifyStageChanged: (cue: unknown) => {
        events.push({ kind: "stage", payload: cue });
      },
      syncScene: (scene: Scene, previousScene: Scene) => {
        events.push({ kind: "scene", payload: { scene, previousScene } });
      },
    };

    syncAudioScene(audio, "start", "playing", {
      run: {
        progress: { encounterIndex: 3 },
        options: { threatTier: 1 },
      },
    } as never);

    expect(events).toEqual([
      { kind: "stage", payload: { id: "midboss", variant: 0 } },
      { kind: "scene", payload: { scene: "playing", previousScene: "start" } },
    ]);
  });

  test("syncAudioScene does nothing when scene is unchanged", () => {
    const events: string[] = [];
    const audio = {
      notifyStageChanged: () => events.push("stage"),
      syncScene: () => events.push("scene"),
    };

    syncAudioScene(audio, "playing", "playing", {
      run: {
        progress: { encounterIndex: 5 },
        options: { threatTier: 1 },
      },
    } as never);

    expect(events).toEqual([]);
  });
});
