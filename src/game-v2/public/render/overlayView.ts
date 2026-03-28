import type { RuntimeErrorKey, Scene, StageMissionStatus } from "../types";
import type { VisualState } from "../uiTheme";

export interface OverlayStageView {
  current: number;
  total: number;
}

export interface OverlayRecordView {
  overallBestScore: number;
  courseBestScore: number;
  latestRunScore: number;
  deltaToBest: number;
  currentRunRecord: boolean;
}

export interface OverlayViewModel {
  scene: Scene;
  score: number;
  lives: number;
  stage: OverlayStageView;
  visual: VisualState;
  record: OverlayRecordView;
  clearElapsedSec?: number;
  error?: {
    key: RuntimeErrorKey;
    detail?: string;
  };
  stageResult?: StageResultView;
  campaignResults?: StageResultSummaryView[];
  storyStageNumber?: number;
}

export interface StageResultView {
  stars: 1 | 2 | 3;
  ratingScore: number;
  clearTimeSec: number;
  hitsTaken: number;
  livesLeft: number;
  missionTargetSec: number;
  missionAchieved: boolean;
  missionResults: StageMissionStatus[];
}

export interface StageResultSummaryView {
  stageNumber: number;
  stars: 1 | 2 | 3;
  ratingScore: number;
  clearTimeSec: number;
  livesLeft: number;
  missionTargetSec: number;
  missionAchieved: boolean;
  missionResults: StageMissionStatus[];
}
