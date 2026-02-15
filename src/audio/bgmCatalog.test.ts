import { describe, expect, test } from "bun:test";

import { getAllStageBgmTracks, getStageBgmTrack, getTitleBgmTrack } from "./bgmCatalog";

describe("bgmCatalog", () => {
  test("provides title and 12 unique stage tracks", () => {
    const title = getTitleBgmTrack();
    const stages = getAllStageBgmTracks();

    expect(title.id).toBe("title");
    expect(title.tempo).toBe(108);
    expect(stages).toHaveLength(12);

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

  test("switches BGM themes every 3 stages with distinct timbre", () => {
    const stage1 = getStageBgmTrack(1);
    const stage4 = getStageBgmTrack(4);
    const stage7 = getStageBgmTrack(7);
    const stage10 = getStageBgmTrack(10);

    expect(stage1.theme).not.toBe(stage4.theme);
    expect(stage4.theme).not.toBe(stage7.theme);
    expect(stage7.theme).not.toBe(stage10.theme);
    expect(`${stage1.leadWave}/${stage1.bassWave}`).not.toBe(`${stage10.leadWave}/${stage10.bassWave}`);
  });

  test("includes polyphonic harmony notes for richer chord feel", () => {
    const stage1 = getStageBgmTrack(1);
    const harmonySteps = stage1.steps.filter((step) => (step.harmonyMidis?.length ?? 0) > 0);
    const triadSteps = stage1.steps.filter((step) => (step.harmonyMidis?.length ?? 0) >= 2);

    expect(stage1.harmonyWave).toBeDefined();
    expect(harmonySteps.length).toBeGreaterThan(0);
    expect(triadSteps.length).toBeGreaterThan(0);
  });

  test("adds counter melody and pad steps for layered accompaniment", () => {
    const stage2 = getStageBgmTrack(2);
    const counterSteps = stage2.steps.filter((step) => typeof step.counterMidi === "number");
    const padSteps = stage2.steps.filter((step) => (step.padMidis?.length ?? 0) > 0);

    expect(counterSteps.length).toBeGreaterThan(0);
    expect(padSteps.length).toBeGreaterThan(0);
  });

  test("increases accompaniment density across stage 1/2/3 in the same theme", () => {
    const stage1 = getStageBgmTrack(1);
    const stage2 = getStageBgmTrack(2);
    const stage3 = getStageBgmTrack(3);

    const scoreTrackDensity = (track: ReturnType<typeof getStageBgmTrack>): number =>
      track.steps.reduce((score, step) => {
        const harmony = step.harmonyMidis?.length ?? 0;
        const counter = typeof step.counterMidi === "number" ? 1 : 0;
        const pad = step.padMidis?.length ?? 0;
        return score + harmony + counter + pad;
      }, 0);

    const d1 = scoreTrackDensity(stage1);
    const d2 = scoreTrackDensity(stage2);
    const d3 = scoreTrackDensity(stage3);

    expect(d1).toBeLessThan(d2);
    expect(d2).toBeLessThan(d3);
  });
});
