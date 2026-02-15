import { describe, expect, test } from "bun:test";
import { syncAudioScene } from "./audioSync";
import type { Scene } from "./types";

describe("audioSync", () => {
  test("syncAudioScene propagates stage and scene changes when scene changes", () => {
    const events: Array<{ kind: "stage" | "scene"; payload: unknown }> = [];
    const audio = {
      notifyStageChanged: (stageIndex: number) => {
        events.push({ kind: "stage", payload: stageIndex });
      },
      syncScene: (scene: Scene, previousScene: Scene) => {
        events.push({ kind: "scene", payload: { scene, previousScene } });
      },
    };

    syncAudioScene(audio, "start", "playing", 3);

    expect(events).toEqual([
      { kind: "stage", payload: 3 },
      { kind: "scene", payload: { scene: "playing", previousScene: "start" } },
    ]);
  });

  test("syncAudioScene does nothing when scene is unchanged", () => {
    const events: string[] = [];
    const audio = {
      notifyStageChanged: () => events.push("stage"),
      syncScene: () => events.push("scene"),
    };

    syncAudioScene(audio, "playing", "playing", 5);

    expect(events).toEqual([]);
  });
});
