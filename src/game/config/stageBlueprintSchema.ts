import { z } from "zod";
import type { StageDefinition } from "../types";
import {
  BOSS_ATTACK_KINDS,
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
} from "../domain/contentTypes";

const stageSpecialSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  kind: z.enum(STAGE_SPECIAL_KINDS),
});

const stageVisualProfileSchema = z.object({
  depth: z.enum(STAGE_VISUAL_DEPTHS),
  arenaFrame: z.enum(STAGE_ARENA_FRAMES),
  blockMaterial: z.enum(STAGE_BLOCK_MATERIALS),
  particleDensity: z.number().positive(),
  cameraIntensity: z.enum(STAGE_CAMERA_INTENSITIES),
  bossTone: z.enum(STAGE_BOSS_TONES),
});

const stageBoardMechanicSchema = z.object({
  role: z.enum(STAGE_MECHANIC_ROLES),
  label: z.string().min(1),
  intensity: z.enum(THREAT_LEVELS),
});

const stageHazardScriptSchema = z.object({
  id: z.enum(STAGE_HAZARD_SCRIPT_IDS),
  intensity: z.enum(THREAT_LEVELS),
});

const encounterTimelineSchema = z.object({
  trigger: z.enum(ENCOUNTER_TIMELINE_TRIGGERS),
  cue: z.enum(ENCOUNTER_CUE_KINDS),
  threatLevel: z.enum(THREAT_LEVELS),
  durationSec: z.number().positive(),
});

const stageDefinitionSchema = z.object({
  id: z.number().int().positive(),
  speedScale: z.number().min(0.5).max(2),
  layout: z
    .array(z.array(z.union([z.literal(0), z.literal(1)])))
    .min(1)
    .refine((rows) => rows.every((row) => row.length > 0), "layout must include columns"),
  chapter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  archetype: z.enum(STAGE_ARCHETYPES).optional(),
  tags: z.array(z.enum(STAGE_TAGS)).optional(),
  events: z.array(z.enum(STAGE_EVENT_KEYS)).optional(),
  specials: z.array(stageSpecialSchema).optional(),
  visualProfile: stageVisualProfileSchema.optional(),
  boardMechanics: z.array(stageBoardMechanicSchema).optional(),
  hazardScript: stageHazardScriptSchema.optional(),
  encounterTimeline: z.array(encounterTimelineSchema).optional(),
  scoreFocus: z.enum(SCORE_FOCUSES).optional(),
  bonusRules: z.array(z.enum(STAGE_BONUS_RULES)).optional(),
  enemyShotProfile: z.enum(ENEMY_SHOT_PROFILES).optional(),
  visualSetId: z.string().min(1).optional(),
  previewTags: z.array(z.enum(STAGE_PREVIEW_TAGS)).optional(),
  missions: z.array(z.enum(STAGE_MISSION_KEYS)).min(2).max(2).optional(),
  encounter: z
    .object({
      kind: z.enum(ENCOUNTER_KINDS),
      profile: z.enum(ENCOUNTER_PROFILES),
      bossDefinition: z
        .object({
          profile: z.enum(ENCOUNTER_PROFILES),
          label: z.string().min(1),
          telegraphSet: z.array(z.enum(BOSS_ATTACK_KINDS)).min(1),
          phaseRules: z.array(
            z.object({
              phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              hpRatioThreshold: z.number().positive().max(1),
              threatLevel: z.enum(THREAT_LEVELS),
              punishWindowSec: z.number().positive(),
            }),
          ),
          attackPatterns: z.array(
            z.object({
              phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              attacks: z.array(z.enum(BOSS_ATTACK_KINDS)).min(1),
            }),
          ),
          breakpoints: z.array(z.number().positive().max(1)),
          punishWindows: z.array(z.number().positive()),
          arenaEffects: z.array(z.enum(ENCOUNTER_CUE_KINDS)).min(1),
          projectileSkin: z.enum(ENEMY_SHOT_PROFILES),
          cancelReward: z.number().nonnegative(),
          phaseScoreRules: z.array(
            z.object({
              phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              bonusPerWeakHit: z.number().nonnegative(),
            }),
          ),
        })
        .optional(),
    })
    .optional(),
  elite: z
    .array(
      z.object({
        row: z.number().int().min(0),
        col: z.number().int().min(0),
        kind: z.enum(STAGE_ELITE_KINDS),
      }),
    )
    .optional(),
});

export function validateStageCatalog(catalog: StageDefinition[]): StageDefinition[] {
  const parsed = z.array(stageDefinitionSchema).min(1).safeParse(catalog);
  if (!parsed.success) {
    throw new Error(
      `Invalid STAGE_CATALOG: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  const columnCount = parsed.data[0].layout[0]?.length ?? 0;
  if (columnCount <= 0) {
    throw new Error("Invalid STAGE_CATALOG: empty layout columns");
  }

  for (const stage of parsed.data) {
    if (stage.layout.some((row) => row.length !== columnCount)) {
      throw new Error(`Invalid STAGE_CATALOG: inconsistent row width in stage ${stage.id}`);
    }
    for (const elite of stage.elite ?? []) {
      if (elite.row >= stage.layout.length || elite.col >= columnCount) {
        throw new Error(`Invalid STAGE_CATALOG: elite cell out of range in stage ${stage.id}`);
      }
      if (stage.layout[elite.row]?.[elite.col] !== 1) {
        throw new Error(
          `Invalid STAGE_CATALOG: elite cell must be placed on a brick in stage ${stage.id}`,
        );
      }
    }
    const occupied = new Set((stage.elite ?? []).map((elite) => `${elite.row}:${elite.col}`));
    for (const special of stage.specials ?? []) {
      if (special.row >= stage.layout.length || special.col >= columnCount) {
        throw new Error(`Invalid STAGE_CATALOG: special cell out of range in stage ${stage.id}`);
      }
      const key = `${special.row}:${special.col}`;
      if (occupied.has(key)) {
        throw new Error(
          `Invalid STAGE_CATALOG: overlapping special/elite cell in stage ${stage.id}`,
        );
      }
      occupied.add(key);
    }
  }

  return catalog;
}
