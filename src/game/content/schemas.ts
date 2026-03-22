import { z } from "zod";
import {
  BOSS_ATTACK_KINDS,
  ENCOUNTER_CUE_KINDS,
  ENCOUNTER_KINDS,
  ENCOUNTER_PROFILES,
  ENEMY_SHOT_PROFILES,
  SCORE_FOCUSES,
  STAGE_ARENA_FRAMES,
  STAGE_BLOCK_MATERIALS,
  STAGE_BOSS_TONES,
  STAGE_CAMERA_INTENSITIES,
  STAGE_MECHANIC_ROLES,
  STAGE_PREVIEW_TAGS,
  STAGE_VISUAL_DEPTHS,
  THREAT_LEVELS,
} from "../domain/contentTypes";

const threatLevelSchema = z.enum(THREAT_LEVELS);
const scoreFocusSchema = z.enum(SCORE_FOCUSES);
const previewTagSchema = z.enum(STAGE_PREVIEW_TAGS);
const encounterProfileSchema = z.enum(ENCOUNTER_PROFILES);
const encounterClimaxSchema = z.enum(ENCOUNTER_KINDS);
const encounterObjectiveSchema = z.enum([
  "stop-first-threat",
  "route-control",
  "break-window",
  "score-window",
]);
const moduleRoleSchema = z.enum(["offense", "control", "survival", "break"]);
const moduleCategorySchema = z.enum(["core", "tactical", "active"]);
const themeIdSchema = z.enum(["chapter1", "chapter2", "chapter3", "midboss", "finalboss", "tier2"]);
const bossAttackKindSchema = z.enum(BOSS_ATTACK_KINDS);
const cueKindSchema = z.enum(ENCOUNTER_CUE_KINDS);
const enemyShotProfileSchema = z.enum(ENEMY_SHOT_PROFILES);
const stageMechanicRoleSchema = z.enum(STAGE_MECHANIC_ROLES);
const moduleSynergyTagSchema = z.enum(["offense", "control", "survival", "boss_break"]);
const encounterBiasSchema = z.enum(["midboss", "boss", "any"]);

const layoutSchema = z
  .array(z.array(z.union([z.literal(0), z.literal(1)])))
  .min(1)
  .refine((rows) => rows.every((row) => row.length > 0), "layout must include columns");

const stageSchema = z.object({
  id: z.number().int().positive(),
  layout: layoutSchema,
  visualSetId: z.string().min(1).optional(),
  scoreFocus: scoreFocusSchema.optional(),
  previewTags: z.array(previewTagSchema).optional(),
  boardMechanics: z
    .array(
      z.object({
        role: stageMechanicRoleSchema,
        label: z.string().min(1),
        intensity: threatLevelSchema,
      }),
    )
    .optional(),
  encounter: z
    .object({
      kind: encounterClimaxSchema.exclude(["none"]),
      profile: encounterProfileSchema.exclude(["none"]),
    })
    .optional(),
});

export const encounterDefinitionSchema = z.object({
  id: z.string().min(1),
  act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  stageNumber: z.number().int().positive(),
  stageIndex: z.number().int().min(0),
  label: z.string().min(1),
  stage: stageSchema,
  mechanicSet: z.array(stageMechanicRoleSchema),
  scoreObjective: scoreFocusSchema,
  previewTags: z.array(previewTagSchema),
  climax: encounterClimaxSchema,
  rewardChoice: z.literal("module_pair"),
  visualTheme: z.string().min(1),
  threatLevel: threatLevelSchema,
  encounterProfile: encounterProfileSchema,
  objective: encounterObjectiveSchema,
});

export const runDefinitionSchema = z.object({
  id: z.literal("campaign"),
  threatTier: z.union([z.literal(1), z.literal(2)]),
  title: z.string().min(1),
  acts: z.array(
    z.object({
      id: z.string().regex(/^act-\d+$/),
      label: z.string().min(1),
      encounterIds: z.array(z.string().min(1)).min(1),
    }),
  ),
  encounters: z.array(encounterDefinitionSchema).min(1),
  finalSequenceIds: z.array(z.string().min(1)).min(1),
});

const moduleDefinitionSchema = z.object({
  type: z.string().min(1),
  category: moduleCategorySchema,
  role: moduleRoleSchema,
  color: z.string().min(1),
  encounterBias: encounterBiasSchema.optional(),
  synergyTags: z.array(moduleSynergyTagSchema),
  counterplayTags: z.array(previewTagSchema),
  previewTags: z.array(previewTagSchema),
});

export const moduleCatalogSchema = z.object({
  core: z.array(moduleDefinitionSchema),
  tactical: z.array(moduleDefinitionSchema),
  active: z.array(moduleDefinitionSchema),
});

export const themeDefinitionSchema = z.object({
  id: themeIdSchema,
  label: z.string().min(1),
  backdropStart: z.string().min(1),
  backdropEnd: z.string().min(1),
  backdropStroke: z.string().min(1),
  progressBar: z.string().min(1),
  hudAccent: z.string().min(1),
  dangerAccent: z.string().min(1),
  panelGlow: z.string().min(1),
  patternColor: z.string().min(1),
  brickPalette: z.array(z.string().min(1)).min(1),
  backdropDepth: z.enum(STAGE_VISUAL_DEPTHS),
  arenaFrame: z.enum(STAGE_ARENA_FRAMES),
  blockMaterial: z.enum(STAGE_BLOCK_MATERIALS),
  particleDensity: z.number().positive(),
  cameraIntensity: z.enum(STAGE_CAMERA_INTENSITIES),
  bossTone: z.enum(STAGE_BOSS_TONES),
});

export const bossDefinitionSchema = z.object({
  profile: encounterProfileSchema.exclude(["none"]),
  label: z.string().min(1),
  telegraphSet: z.array(bossAttackKindSchema).min(1),
  phaseRules: z
    .array(
      z.object({
        phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        hpRatioThreshold: z.number().positive(),
        threatLevel: threatLevelSchema,
        punishWindowSec: z.number().positive(),
      }),
    )
    .length(3),
  attackPatterns: z
    .array(
      z.object({
        phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        attacks: z.array(bossAttackKindSchema).min(1),
      }),
    )
    .length(3),
  breakpoints: z.array(z.number().positive()).min(1),
  punishWindows: z.array(z.number().positive()).length(3),
  arenaEffects: z.array(cueKindSchema).min(1),
  projectileSkin: enemyShotProfileSchema,
  cancelReward: z.number().nonnegative(),
  phaseScoreRules: z
    .array(
      z.object({
        phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        bonusPerWeakHit: z.number().nonnegative(),
      }),
    )
    .length(3),
});
