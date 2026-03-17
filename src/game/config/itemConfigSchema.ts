import { z } from "zod";
import type { ItemRule } from "./types";
import type { ItemType } from "../types";

const itemRuleSchema = z.object({
  type: z.string().min(1),
  weight: z.number().positive(),
  label: z.string().min(1),
});

export function validateItemConfig(config: Record<ItemType, ItemRule>): Record<ItemType, ItemRule> {
  const entries = Object.values(config);
  const parsed = z.array(itemRuleSchema).length(11).safeParse(entries);
  if (!parsed.success) {
    throw new Error(
      `Invalid ITEM_CONFIG: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  const weightTotal = entries.reduce((total, rule) => total + rule.weight, 0);
  if (Math.abs(weightTotal - 1) > 0.001) {
    throw new Error(`Invalid ITEM_CONFIG: weight total must be 1 (actual ${weightTotal})`);
  }

  return config;
}
