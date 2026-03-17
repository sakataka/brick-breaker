import type { Difficulty, ItemType, StageMissionKey } from "../domainTypes";

export interface RunProgressState {
  encounterIndex: number;
  totalEncounters: number;
  encounterStartScore: number;
  results: StageResultEntry[];
  unlockedThreatTier: 1 | 2;
}

export interface StageMissionStatus {
  key: StageMissionKey;
  targetSec?: number;
  achieved: boolean;
}

export interface StageResultEntry {
  stageNumber: number;
  clearTimeSec: number;
  stars: 1 | 2 | 3;
  ratingScore: number;
  livesAtClear: number;
  missionTargetSec: number;
  missionAchieved: boolean;
  missionResults: StageMissionStatus[];
}

export interface RunModulePolicy {
  enabledTypes: ItemType[];
  allowExtendedStacks: boolean;
}

export interface ComboState {
  multiplier: number;
  streak: number;
  lastHitSec: number;
  rewardGranted: boolean;
  fillTriggered: boolean;
}

export interface RecordState {
  overallBestScore: number;
  tier1BestScore: number;
  tier2BestScore: number;
  latestRunScore: number;
  currentRunRecord: boolean;
  deltaToBest: number;
}

export interface RunOptions {
  threatTier: 1 | 2;
  difficulty: Difficulty;
  reducedMotionEnabled: boolean;
  highContrastEnabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface RunState {
  score: number;
  lives: number;
  lastGameOverScore: number | null;
  elapsedSec: number;
  progress: RunProgressState;
  combo: ComboState;
  options: RunOptions;
  modulePolicy: RunModulePolicy;
  records: RecordState;
}
