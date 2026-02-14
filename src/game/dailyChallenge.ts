export interface DailyChallenge {
  key: string;
  seed: number;
  objective: string;
}

const DAILY_OBJECTIVES = [
  "ノーミスで1ステージクリア",
  "コンボ x2.0 を達成",
  "アイテムを3個以上取得",
] as const;

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const key = `${year}-${month}-${day}`;
  const seed = hashStringToSeed(key);
  const objective = DAILY_OBJECTIVES[seed % DAILY_OBJECTIVES.length] ?? DAILY_OBJECTIVES[0];

  return {
    key,
    seed,
    objective,
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
