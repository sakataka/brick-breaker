import type { StageModifierKey, ThemeBandId } from "./config";
import type { StageMissionStatus } from "./runtimeTypes";
import type {
  Ball,
  Brick,
  FallingItem,
  FloatingText,
  ImpactRing,
  ItemType,
  Particle,
  RuntimeErrorKey,
  Scene,
  StageRoute,
  Vector2,
} from "./types";

export interface RenderViewState {
  scene: Scene;
  elapsedSec: number;
  bricks: Brick[];
  paddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    glowActive: boolean;
  };
  balls: Ball[];
  trail: Vector2[];
  particles: Particle[];
  impactRings: ImpactRing[];
  floatingTexts: FloatingText[];
  flashMs: number;
  reducedMotion: boolean;
  highContrast: boolean;
  shake: {
    active: boolean;
    offset: Vector2;
  };
  fallingItems: FallingItem[];
  progressRatio: number;
  themeBandId: ThemeBandId;
  slowBallActive: boolean;
  multiballActive: boolean;
  shieldCharges: number;
  showSceneOverlayTint: boolean;
  enemies: Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    alive: boolean;
  }>;
  laserProjectiles: Array<{
    id: number;
    x: number;
    y: number;
  }>;
  fluxFieldActive: boolean;
  stageModifierKey?: StageModifierKey;
  warpZones?: Array<{
    inXMin: number;
    inXMax: number;
    inYMin: number;
    inYMax: number;
    outX: number;
    outY: number;
  }>;
  ghostPlayback?: {
    paddleX: number;
    ballX: number;
    ballY: number;
  };
}

export interface HudActiveItemView {
  type: ItemType;
  count: number;
  emoji: string;
}

export interface HudViewModel {
  score: number;
  lives: number;
  elapsedSec: number;
  comboMultiplier: number;
  stage: {
    mode: "campaign" | "endless" | "boss_rush";
    current: number;
    total: number;
    route: StageRoute | null;
    modifierKey?: StageModifierKey;
    boss?: {
      hp: number;
      maxHp: number;
      phase: 1 | 2;
    };
    debugModeEnabled: boolean;
    debugRecordResults: boolean;
  };
  activeItems: HudActiveItemView[];
  flags: {
    hazardBoostActive: boolean;
    pierceSlowSynergy: boolean;
    riskMode: boolean;
    rogueUpgradesTaken: number;
    rogueUpgradeCap: number;
    magicCooldownSec: number;
    warpLegendVisible: boolean;
  };
  progressRatio: number;
  accentColor: string;
}

export interface OverlayStageView {
  mode: "campaign" | "endless" | "boss_rush";
  current: number;
  total: number;
  debugModeEnabled: boolean;
  debugRecordResults: boolean;
}

export interface OverlayViewModel {
  scene: Scene;
  score: number;
  lives: number;
  stage: OverlayStageView;
  clearElapsedSec?: number;
  error?: {
    key: RuntimeErrorKey;
    detail?: string;
  };
  stageResult?: StageResultView;
  campaignResults?: StageResultSummaryView[];
  rogueOffer?: RogueOfferView;
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

export interface RogueOfferView {
  options: [RogueUpgradeTypeView, RogueUpgradeTypeView];
  remaining: number;
}

export type RogueUpgradeTypeView = "paddle_core" | "speed_core" | "score_core";
