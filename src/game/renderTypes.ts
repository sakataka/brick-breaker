import type { StageModifierKey, ThemeBandId } from "./config";
import type { StageMissionStatus } from "./runtimeTypes";
import type {
  Ball,
  BossAttackKind,
  BossLane,
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
  flashColor: string;
  reducedMotion: boolean;
  highContrast: boolean;
  shake: {
    active: boolean;
    offset: Vector2;
  };
  fallingItems: FallingItem[];
  progressRatio: number;
  themeBandId: ThemeBandId;
  visualTheme: {
    accent: string;
    danger: string;
    glow: string;
    pattern: string;
  };
  stageIntro?: {
    kind: "stage" | "midboss" | "boss" | "ex";
    progress: number;
  };
  bossBanner?: {
    phase: 1 | 2 | 3;
    warningLevel: "calm" | "elevated" | "critical";
  };
  warningLevel: "calm" | "elevated" | "critical";
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
  bossProjectiles: Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
  }>;
  bossTelegraph?: {
    kind: BossAttackKind;
    lane?: BossLane;
    targetX?: number;
    spread?: number;
    progress: number;
  };
  bossSweep?: {
    lane: BossLane;
    progress: number;
  };
  dangerLanes?: BossLane[];
  encounterCast?: {
    kind: BossAttackKind;
    progress: number;
  };
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
  paddleAuraColor?: string;
  ballAuraColor?: string;
}

export interface HudActiveItemView {
  type: ItemType;
  count: number;
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
      phase: 1 | 2 | 3;
      intent?: BossAttackKind;
      castProgress?: number;
      weakWindowProgress?: number;
    };
    debugModeEnabled: boolean;
    debugRecordResults: boolean;
  };
  missionProgress: StageMissionStatus[];
  activeItems: HudActiveItemView[];
  visualThemeId: ThemeBandId;
  stageIntro?: {
    kind: "stage" | "midboss" | "boss" | "ex";
    progress: number;
  };
  bossBanner?: {
    phase: 1 | 2 | 3;
    warningLevel: "calm" | "elevated" | "critical";
  };
  flags: {
    hazardBoostActive: boolean;
    pierceSlowSynergy: boolean;
    riskMode: boolean;
    rogueUpgradesTaken: number;
    rogueUpgradeCap: number;
    magicCooldownSec: number;
    warpLegendVisible: boolean;
    steelLegendVisible: boolean;
    generatorLegendVisible: boolean;
    gateLegendVisible: boolean;
    turretLegendVisible: boolean;
    overdriveActive: boolean;
  };
  progressRatio: number;
  accentColor: string;
  dangerColor: string;
  riskChain: {
    value: number;
    max: number;
    progress: number;
  };
  overdrive?: {
    progress: number;
  };
  pickupToast?: {
    type: ItemType;
    color: string;
    progress: number;
  };
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
