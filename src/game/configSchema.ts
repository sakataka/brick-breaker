import { z } from "zod";
import type { ItemRule } from "./config/types";
import type { ItemType, StageDefinition } from "./types";

const stageSpecialSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  kind: z.union([z.literal("steel"), z.literal("generator")]),
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
    ])
    .optional(),
  tags: z
    .array(
      z.union([z.literal("steel"), z.literal("generator"), z.literal("enemy_pressure"), z.literal("boss")]),
    )
    .optional(),
  events: z
    .array(z.union([z.literal("generator_respawn"), z.literal("enemy_pressure"), z.literal("boss_duel")]))
    .optional(),
  specials: z.array(stageSpecialSchema).optional(),
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

const itemRuleSchema = z.object({
  type: z.string().min(1),
  weight: z.number().positive(),
  label: z.string().min(1),
});

export function validateStageCatalog(catalog: StageDefinition[]): StageDefinition[] {
  const parsed = z.array(stageDefinitionSchema).min(1).safeParse(catalog);
  if (!parsed.success) {
    throw new Error(`Invalid STAGE_CATALOG: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
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
        throw new Error(`Invalid STAGE_CATALOG: elite cell must be placed on a brick in stage ${stage.id}`);
      }
    }
    const occupied = new Set((stage.elite ?? []).map((elite) => `${elite.row}:${elite.col}`));
    for (const special of stage.specials ?? []) {
      if (special.row >= stage.layout.length || special.col >= columnCount) {
        throw new Error(`Invalid STAGE_CATALOG: special cell out of range in stage ${stage.id}`);
      }
      const key = `${special.row}:${special.col}`;
      if (occupied.has(key)) {
        throw new Error(`Invalid STAGE_CATALOG: overlapping special/elite cell in stage ${stage.id}`);
      }
      occupied.add(key);
    }
  }

  return catalog;
}

export function validateItemConfig(config: Record<ItemType, ItemRule>): Record<ItemType, ItemRule> {
  const entries = Object.values(config);
  const parsed = z.array(itemRuleSchema).length(11).safeParse(entries);
  if (!parsed.success) {
    throw new Error(`Invalid ITEM_CONFIG: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
  }

  const weightTotal = entries.reduce((total, rule) => total + rule.weight, 0);
  if (Math.abs(weightTotal - 1) > 0.001) {
    throw new Error(`Invalid ITEM_CONFIG: weight total must be 1 (actual ${weightTotal})`);
  }

  return config;
}
