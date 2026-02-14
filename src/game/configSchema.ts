import { z } from "zod";
import type { ItemRule } from "./config/items";
import type { ItemType, StageDefinition } from "./types";

const stageDefinitionSchema = z.object({
  id: z.number().int().positive(),
  speedScale: z.number().min(0.5).max(2),
  layout: z
    .array(z.array(z.union([z.literal(0), z.literal(1)])))
    .min(1)
    .refine((rows) => rows.every((row) => row.length > 0), "layout must include columns"),
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
  }

  return catalog;
}

export function validateItemConfig(config: Record<ItemType, ItemRule>): Record<ItemType, ItemRule> {
  const entries = Object.values(config);
  const parsed = z.array(itemRuleSchema).length(6).safeParse(entries);
  if (!parsed.success) {
    throw new Error(`Invalid ITEM_CONFIG: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
  }

  const weightTotal = entries.reduce((total, rule) => total + rule.weight, 0);
  if (Math.abs(weightTotal - 1) > 0.001) {
    throw new Error(`Invalid ITEM_CONFIG: weight total must be 1 (actual ${weightTotal})`);
  }

  return config;
}
