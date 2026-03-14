export interface MetaProgress {
  exUnlocked: boolean;
}

const STORAGE_KEY = "brick_breaker:meta_progress";

export function readMetaProgress(storage?: Pick<Storage, "getItem"> | null): MetaProgress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) {
      return { exUnlocked: false };
    }
    const parsed = JSON.parse(raw) as Partial<MetaProgress>;
    return {
      exUnlocked: parsed.exUnlocked === true,
    };
  } catch {
    return { exUnlocked: false };
  }
}

export function writeMetaProgress(
  storage: Pick<Storage, "setItem"> | null | undefined,
  meta: MetaProgress,
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {}
}

export function shouldUnlockEx(state: {
  scene: string;
  options: {
    campaignCourse: string;
    debugModeEnabled: boolean;
    debugRecordResults: boolean;
  };
}): boolean {
  return (
    state.scene === "clear" &&
    state.options.campaignCourse === "normal" &&
    !state.options.debugModeEnabled &&
    state.options.debugRecordResults
  );
}
