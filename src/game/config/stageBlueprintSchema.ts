import { z } from "zod";
import type { StageDefinition } from "../types";

const stageSpecialSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  kind: z.union([
    z.literal("steel"),
    z.literal("generator"),
    z.literal("gate"),
    z.literal("turret"),
  ]),
});

const stageVisualProfileSchema = z.object({
  depth: z.union([z.literal("stellar"), z.literal("orbital"), z.literal("fortress")]),
  arenaFrame: z.union([z.literal("clean"), z.literal("hazard"), z.literal("citadel")]),
  blockMaterial: z.union([
    z.literal("glass"),
    z.literal("alloy"),
    z.literal("armor"),
    z.literal("core"),
  ]),
  particleDensity: z.number().positive(),
  cameraIntensity: z.union([z.literal("steady"), z.literal("alert"), z.literal("assault")]),
  bossTone: z.union([
    z.literal("hunter"),
    z.literal("artillery"),
    z.literal("citadel"),
    z.literal("overlord"),
  ]),
});

const stageBoardMechanicSchema = z.object({
  role: z.union([
    z.literal("shield"),
    z.literal("relay"),
    z.literal("reactor"),
    z.literal("turret"),
    z.literal("hazard"),
  ]),
  label: z.string().min(1),
  intensity: z.union([
    z.literal("low"),
    z.literal("medium"),
    z.literal("high"),
    z.literal("critical"),
  ]),
});

const stageHazardScriptSchema = z.object({
  id: z.union([
    z.literal("none"),
    z.literal("gate_pulse"),
    z.literal("turret_crossfire"),
    z.literal("flux_field"),
    z.literal("reactor_chain"),
    z.literal("boss_arena"),
  ]),
  intensity: z.union([
    z.literal("low"),
    z.literal("medium"),
    z.literal("high"),
    z.literal("critical"),
  ]),
});

const encounterTimelineSchema = z.object({
  trigger: z.union([
    z.literal("stage_start"),
    z.literal("elapsed_10"),
    z.literal("elapsed_20"),
    z.literal("boss_phase_2"),
    z.literal("boss_phase_3"),
    z.literal("generator_down"),
    z.literal("turret_destroyed"),
    z.literal("board_clear"),
  ]),
  cue: z.union([
    z.literal("boss_phase_shift"),
    z.literal("shield_online"),
    z.literal("relay_online"),
    z.literal("reactor_critical"),
    z.literal("warning_lane"),
    z.literal("turret_crossfire"),
    z.literal("stage_breakthrough"),
    z.literal("punish_window"),
    z.literal("hazard_surge"),
  ]),
  threatLevel: z.union([
    z.literal("low"),
    z.literal("medium"),
    z.literal("high"),
    z.literal("critical"),
  ]),
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
  archetype: z
    .union([
      z.literal("wide_open"),
      z.literal("corridor"),
      z.literal("chokepoint"),
      z.literal("control"),
      z.literal("split_lane"),
      z.literal("boss_arena"),
      z.literal("tier2_arena"),
    ])
    .optional(),
  tags: z
    .array(
      z.union([
        z.literal("steel"),
        z.literal("generator"),
        z.literal("gate"),
        z.literal("turret"),
        z.literal("enemy_pressure"),
        z.literal("boss"),
        z.literal("midboss"),
      ]),
    )
    .optional(),
  events: z
    .array(
      z.union([
        z.literal("generator_respawn"),
        z.literal("enemy_pressure"),
        z.literal("boss_duel"),
        z.literal("gate_cycle"),
        z.literal("turret_fire"),
        z.literal("midboss_duel"),
      ]),
    )
    .optional(),
  specials: z.array(stageSpecialSchema).optional(),
  visualProfile: stageVisualProfileSchema.optional(),
  boardMechanics: z.array(stageBoardMechanicSchema).optional(),
  hazardScript: stageHazardScriptSchema.optional(),
  encounterTimeline: z.array(encounterTimelineSchema).optional(),
  scoreFocus: z
    .union([
      z.literal("reactor_chain"),
      z.literal("turret_cancel"),
      z.literal("boss_break"),
      z.literal("survival_chain"),
    ])
    .optional(),
  bonusRules: z
    .array(
      z.union([
        z.literal("hazard_first"),
        z.literal("cancel_shots"),
        z.literal("weak_window_burst"),
        z.literal("no_drop_chain"),
      ]),
    )
    .optional(),
  enemyShotProfile: z
    .union([z.literal("spike_orb"), z.literal("plasma_bolt"), z.literal("void_core")])
    .optional(),
  visualSetId: z.string().min(1).optional(),
  previewTags: z
    .array(
      z.union([
        z.literal("shielded_grid"),
        z.literal("relay_chain"),
        z.literal("reactor_chain"),
        z.literal("turret_lane"),
        z.literal("hazard_flux"),
        z.literal("gate_pressure"),
        z.literal("boss_break"),
        z.literal("survival_check"),
        z.literal("fortress_core"),
        z.literal("sweep_alert"),
      ]),
    )
    .optional(),
  missions: z
    .array(
      z.union([
        z.literal("time_limit"),
        z.literal("no_shop"),
        z.literal("no_miss_stage"),
        z.literal("combo_x2"),
        z.literal("destroy_turret_first"),
        z.literal("shutdown_generator"),
      ]),
    )
    .min(2)
    .max(2)
    .optional(),
  encounter: z
    .object({
      kind: z.union([
        z.literal("none"),
        z.literal("midboss"),
        z.literal("boss"),
        z.literal("tier2_boss"),
      ]),
      profile: z.union([
        z.literal("none"),
        z.literal("warden"),
        z.literal("artillery"),
        z.literal("final_core"),
        z.literal("tier2_overlord"),
      ]),
      bossDefinition: z
        .object({
          profile: z.union([
            z.literal("none"),
            z.literal("warden"),
            z.literal("artillery"),
            z.literal("final_core"),
            z.literal("tier2_overlord"),
          ]),
          label: z.string().min(1),
          telegraphSet: z.array(z.string().min(1)).min(1),
          phaseRules: z.array(
            z.object({
              phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              hpRatioThreshold: z.number().positive().max(1),
              threatLevel: z.union([
                z.literal("low"),
                z.literal("medium"),
                z.literal("high"),
                z.literal("critical"),
              ]),
              punishWindowSec: z.number().positive(),
            }),
          ),
          attackPatterns: z.array(
            z.object({
              phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              attacks: z.array(z.string().min(1)).min(1),
            }),
          ),
          breakpoints: z.array(z.number().positive().max(1)),
          punishWindows: z.array(z.number().positive()),
          arenaEffects: z.array(z.string().min(1)),
          projectileSkin: z.union([
            z.literal("spike_orb"),
            z.literal("plasma_bolt"),
            z.literal("void_core"),
          ]),
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
        kind: z.union([
          z.literal("durable"),
          z.literal("armored"),
          z.literal("regen"),
          z.literal("hazard"),
          z.literal("boss"),
          z.literal("split"),
          z.literal("summon"),
          z.literal("thorns"),
        ]),
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
