export interface ProgressionSave {
  threatTier2Unlocked: boolean;
}

export interface ScoreRecordSave {
  overallBestScore: number;
  tier1BestScore: number;
  tier2BestScore: number;
  latestRunScore: number;
}

export interface MetaProgress {
  progression: ProgressionSave;
  records: ScoreRecordSave;
}

const LEGACY_STORAGE_KEY = "brick_breaker:meta_progress";
const PROGRESSION_STORAGE_KEY = "brick_breaker:progression";
const RECORD_STORAGE_KEY = "brick_breaker:records";

export const DEFAULT_META_PROGRESS: MetaProgress = {
  progression: {
    threatTier2Unlocked: false,
  },
  records: {
    overallBestScore: 0,
    tier1BestScore: 0,
    tier2BestScore: 0,
    latestRunScore: 0,
  },
};

interface LegacyMetaProgressShape {
  exUnlocked?: boolean;
  overallBestScore?: number;
  normalBestScore?: number;
  exBestScore?: number;
  latestRunScore?: number;
}

export function readMetaProgress(storage?: Pick<Storage, "getItem"> | null): MetaProgress {
  try {
    const progressionRaw = storage?.getItem(PROGRESSION_STORAGE_KEY);
    const recordsRaw = storage?.getItem(RECORD_STORAGE_KEY);
    if (!progressionRaw && !recordsRaw) {
      return readLegacyMetaProgress(storage);
    }

    const parsedProgression = progressionRaw
      ? (JSON.parse(progressionRaw) as Partial<ProgressionSave>)
      : {};
    const parsedRecords = recordsRaw ? (JSON.parse(recordsRaw) as Partial<ScoreRecordSave>) : {};

    return {
      progression: {
        threatTier2Unlocked: parsedProgression.threatTier2Unlocked === true,
      },
      records: {
        overallBestScore: toSafeScore(parsedRecords.overallBestScore),
        tier1BestScore: toSafeScore(parsedRecords.tier1BestScore),
        tier2BestScore: toSafeScore(parsedRecords.tier2BestScore),
        latestRunScore: toSafeScore(parsedRecords.latestRunScore),
      },
    };
  } catch {
    return cloneDefaultMetaProgress();
  }
}

export function writeMetaProgress(
  storage: Pick<Storage, "setItem"> | null | undefined,
  meta: MetaProgress,
): void {
  try {
    storage?.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(meta.progression));
    storage?.setItem(RECORD_STORAGE_KEY, JSON.stringify(meta.records));
  } catch {}
}

export function applyRunScoreToMeta(
  meta: MetaProgress,
  run: {
    score: number;
    threatTier: 1 | 2;
  },
): MetaProgress {
  const safeScore = toSafeScore(run.score);
  return {
    progression: {
      ...meta.progression,
    },
    records: {
      latestRunScore: safeScore,
      overallBestScore: Math.max(meta.records.overallBestScore, safeScore),
      tier1BestScore:
        run.threatTier === 1
          ? Math.max(meta.records.tier1BestScore, safeScore)
          : meta.records.tier1BestScore,
      tier2BestScore:
        run.threatTier === 2
          ? Math.max(meta.records.tier2BestScore, safeScore)
          : meta.records.tier2BestScore,
    },
  };
}

function readLegacyMetaProgress(storage?: Pick<Storage, "getItem"> | null): MetaProgress {
  try {
    const raw = storage?.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return cloneDefaultMetaProgress();
    }
    const parsed = JSON.parse(raw) as LegacyMetaProgressShape;
    return {
      progression: {
        threatTier2Unlocked: parsed.exUnlocked === true,
      },
      records: {
        overallBestScore: toSafeScore(parsed.overallBestScore),
        tier1BestScore: toSafeScore(parsed.normalBestScore),
        tier2BestScore: toSafeScore(parsed.exBestScore),
        latestRunScore: toSafeScore(parsed.latestRunScore),
      },
    };
  } catch {
    return cloneDefaultMetaProgress();
  }
}

function cloneDefaultMetaProgress(): MetaProgress {
  return {
    progression: { ...DEFAULT_META_PROGRESS.progression },
    records: { ...DEFAULT_META_PROGRESS.records },
  };
}

function toSafeScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
