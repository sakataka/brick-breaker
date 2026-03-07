import type { DailyObjectiveKey } from "./types";

export interface DailyChallenge {
  key: string;
  seed: number;
  objectiveKey: DailyObjectiveKey;
}

const DAILY_OBJECTIVES = ["no_miss_stage_clear", "combo_x2", "collect_three_items"] as const;

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const key = `${year}-${month}-${day}`;
  const seed = hashStringToSeed(key);
  const objectiveKey = DAILY_OBJECTIVES[seed % DAILY_OBJECTIVES.length] ?? DAILY_OBJECTIVES[0];

  return {
    key,
    seed,
    objectiveKey,
  };
}

function hashStringToSeed(value: string): number {
  let hash = 2166136261;
  for (const ch of value) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
