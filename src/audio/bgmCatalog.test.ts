import { describe, expect, test } from "vite-plus/test";

import {
  getAllStageBgmTracks,
  getCueBgmTrack,
  getStageBgmTrack,
  getTitleBgmTrack,
} from "./bgmCatalog";
import { PUBLIC_STAGE_BLUEPRINTS } from "../game-v2/content/stageBlueprints";

describe("bgmCatalog", () => {
  test("provides title and 12 unique campaign tracks", () => {
    const title = getTitleBgmTrack();
    const stages = getAllStageBgmTracks();

    expect(title.id).toBe("title");
    expect(title.tempo).toBe(118);
    expect(stages).toHaveLength(12);
    expect(stages.map((track) => track.id)).toEqual(
      PUBLIC_STAGE_BLUEPRINTS[1].map(
        (blueprint) => `${blueprint.musicCue.id}-${blueprint.musicCue.variant}`,
      ),
    );

    const ids = new Set(stages.map((track) => track.id));
    expect(ids.size).toBe(12);
  });

  test("clamps stage selection and returns a full step sequence", () => {
    const stage1 = getStageBgmTrack(1);
    const stageOutLow = getStageBgmTrack(-5);
    const stageOutHigh = getStageBgmTrack(99);

    expect(stage1.steps.length).toBeGreaterThan(0);
    expect(stageOutLow.id).toBe(stage1.id);
    expect(stageOutHigh.id).toBe(getStageBgmTrack(12).id);
  });

  test("switches cue families across campaign milestones with distinct timbre", () => {
    const stage1 = getStageBgmTrack(1);
    const stage4 = getStageBgmTrack(4);
    const stage7 = getStageBgmTrack(7);
    const stage10 = getStageBgmTrack(10);

    expect(stage1.theme).not.toBe(stage4.theme);
    expect(stage4.theme).not.toBe(stage7.theme);
    expect(stage7.theme).not.toBe(stage10.theme);
    expect(`${stage1.leadWave}/${stage1.bassWave}`).not.toBe(
      `${stage10.leadWave}/${stage10.bassWave}`,
    );
  });

  test("includes triad or seventh harmony steps for richer chord feel", () => {
    const stage1 = getCueBgmTrack({ id: "chapter1", variant: 1 });
    const harmonySteps = stage1.steps.filter((step) => (step.harmonyMidis?.length ?? 0) > 0);
    const triadSteps = stage1.steps.filter((step) => (step.harmonyMidis?.length ?? 0) >= 3);

    expect(stage1.harmonyWave).toBeDefined();
    expect(harmonySteps.length).toBeGreaterThan(0);
    expect(triadSteps.length).toBeGreaterThan(0);
  });

  test("adds counter melody and pad steps for layered accompaniment", () => {
    const stage2 = getCueBgmTrack({ id: "chapter2", variant: 2 });
    const counterSteps = stage2.steps.filter((step) => typeof step.counterMidi === "number");
    const padSteps = stage2.steps.filter((step) => (step.padMidis?.length ?? 0) > 0);

    expect(counterSteps.length).toBeGreaterThan(0);
    expect(padSteps.length).toBeGreaterThan(0);
  });

  test("boss cues are faster than early chapter cues", () => {
    const stage1 = getCueBgmTrack({ id: "chapter1", variant: 1 });
    const midboss = getCueBgmTrack({ id: "midboss", variant: 1 });
    const finalBoss = getCueBgmTrack({ id: "finalboss", variant: 1 });

    expect(midboss.tempo).toBeGreaterThan(stage1.tempo);
    expect(finalBoss.tempo).toBeGreaterThan(midboss.tempo);
  });
});
