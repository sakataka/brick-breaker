import type { ThemeBandId } from "./config";
import type { Ball, Brick, FallingItem, FloatingText, ImpactRing, Particle, Scene, Vector2 } from "./types";

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
}

export interface HudViewModel {
  scoreText: string;
  livesText: string;
  timeText: string;
  stageText: string;
  comboText: string;
  itemsText: string;
  accessibilityText: string;
  accentColor: string;
}

export interface OverlayViewModel {
  scene: Scene;
  score: number;
  lives: number;
  clearTime?: string;
  errorMessage?: string;
  stageLabel: string;
  stageResult?: StageResultView;
  campaignResults?: StageResultSummaryView[];
}

export interface StageResultView {
  stars: 1 | 2 | 3;
  ratingScore: number;
  clearTime: string;
  hitsTaken: number;
  livesLeft: number;
}

export interface StageResultSummaryView {
  stageNumber: number;
  stars: 1 | 2 | 3;
  ratingScore: number;
  clearTime: string;
  livesLeft: number;
}
