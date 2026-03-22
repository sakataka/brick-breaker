import { describe, expect, test } from "vite-plus/test";
import {
  ENCOUNTER_CUE_KINDS,
  ENCOUNTER_KINDS,
  ENCOUNTER_PROFILES,
  ENCOUNTER_TIMELINE_TRIGGERS,
  ENEMY_SHOT_PROFILES,
  SCORE_FOCUSES,
  STAGE_ARCHETYPES,
  STAGE_ARENA_FRAMES,
  STAGE_BLOCK_MATERIALS,
  STAGE_BONUS_RULES,
  STAGE_BOSS_TONES,
  STAGE_CAMERA_INTENSITIES,
  STAGE_ELITE_KINDS,
  STAGE_EVENT_KEYS,
  STAGE_HAZARD_SCRIPT_IDS,
  STAGE_MECHANIC_ROLES,
  STAGE_MISSION_KEYS,
  STAGE_PREVIEW_TAGS,
  STAGE_SPECIAL_KINDS,
  STAGE_TAGS,
  STAGE_VISUAL_DEPTHS,
  THREAT_LEVELS,
  type StageDefinition,
} from "../types";
import { validateStageCatalog } from "./stageBlueprintSchema";

function createStage(overrides: Partial<StageDefinition> = {}): StageDefinition {
  return {
    id: 1,
    speedScale: 1,
    layout: [
      [1, 1],
      [1, 1],
    ],
    chapter: 1,
    archetype: STAGE_ARCHETYPES[0],
    tags: [STAGE_TAGS[0]],
    events: [STAGE_EVENT_KEYS[0]],
    specials: [{ row: 0, col: 0, kind: STAGE_SPECIAL_KINDS[0] }],
    elite: [{ row: 0, col: 1, kind: STAGE_ELITE_KINDS[0] }],
    missions: [STAGE_MISSION_KEYS[0], STAGE_MISSION_KEYS[1]],
    visualProfile: {
      depth: STAGE_VISUAL_DEPTHS[0],
      arenaFrame: STAGE_ARENA_FRAMES[0],
      blockMaterial: STAGE_BLOCK_MATERIALS[0],
      particleDensity: 1,
      cameraIntensity: STAGE_CAMERA_INTENSITIES[0],
      bossTone: STAGE_BOSS_TONES[0],
    },
    boardMechanics: [
      {
        role: STAGE_MECHANIC_ROLES[0],
        label: "Shield Grid",
        intensity: THREAT_LEVELS[0],
      },
    ],
    hazardScript: {
      id: STAGE_HAZARD_SCRIPT_IDS[0],
      intensity: THREAT_LEVELS[0],
    },
    encounterTimeline: [
      {
        trigger: ENCOUNTER_TIMELINE_TRIGGERS[0],
        cue: ENCOUNTER_CUE_KINDS[0],
        threatLevel: THREAT_LEVELS[0],
        durationSec: 1,
      },
    ],
    previewTags: [STAGE_PREVIEW_TAGS[0]],
    scoreFocus: SCORE_FOCUSES[0],
    bonusRules: [STAGE_BONUS_RULES[0]],
    enemyShotProfile: ENEMY_SHOT_PROFILES[0],
    visualSetId: "schema-test",
    encounter: {
      kind: ENCOUNTER_KINDS[1],
      profile: ENCOUNTER_PROFILES[1],
    },
    ...overrides,
  };
}

describe("stageBlueprintSchema", () => {
  test("accepts representative values from the shared content literal arrays", () => {
    expect(validateStageCatalog([createStage()])).toHaveLength(1);
  });

  test("rejects values outside the shared content literal arrays", () => {
    expect(() =>
      validateStageCatalog([
        createStage({
          tags: ["invalid-tag"] as unknown as StageDefinition["tags"],
        }),
      ]),
    ).toThrow(/Invalid STAGE_CATALOG/);
  });

  test("stage special and elite kind arrays match schema placement usage", () => {
    for (const specialKind of STAGE_SPECIAL_KINDS) {
      expect(
        validateStageCatalog([
          createStage({
            specials: [{ row: 0, col: 0, kind: specialKind }],
            elite: [{ row: 0, col: 1, kind: STAGE_ELITE_KINDS[0] }],
          }),
        ]),
      ).toHaveLength(1);
    }

    for (const eliteKind of STAGE_ELITE_KINDS) {
      expect(
        validateStageCatalog([
          createStage({
            specials: [{ row: 0, col: 0, kind: STAGE_SPECIAL_KINDS[0] }],
            elite: [{ row: 0, col: 1, kind: eliteKind }],
          }),
        ]),
      ).toHaveLength(1);
    }
  });
});
