import type { Ball, Brick, ItemType, Paddle, Scene, Vector2 } from "./domainTypes";

export interface AssistState {
  untilSec: number;
  paddleScale: number;
  maxSpeedScale: number;
}

export interface Particle {
  pos: Vector2;
  vel: Vector2;
  lifeMs: number;
  maxLifeMs: number;
  size: number;
  color: string;
}

export interface ImpactRing {
  pos: Vector2;
  radiusStart: number;
  radiusEnd: number;
  lifeMs: number;
  maxLifeMs: number;
  color: string;
}

export interface FloatingText {
  text: string;
  pos: Vector2;
  lifeMs: number;
  maxLifeMs: number;
  color: string;
}

export interface VfxState {
  particles: Particle[];
  impactRings: ImpactRing[];
  floatingTexts: FloatingText[];
  flashMs: number;
  shakeMs: number;
  shakePx: number;
  hitFreezeMs: number;
  shakeOffset: Vector2;
  trail: Vector2[];
  densityScale: number;
  reducedMotion: boolean;
}

export type CollisionEventKind = "wall" | "paddle" | "brick" | "miss";

export interface CollisionEvent {
  kind: CollisionEventKind;
  x: number;
  y: number;
  color?: string;
}

export interface CampaignState {
  stageIndex: number;
  totalStages: number;
  stageStartScore: number;
  results: StageResultEntry[];
}

export interface StageResultEntry {
  stageNumber: number;
  clearTimeSec: number;
  stars: 1 | 2 | 3;
  ratingScore: number;
  livesAtClear: number;
  missionTargetSec: number;
  missionAchieved: boolean;
}

export interface FallingItem {
  id: number;
  type: ItemType;
  pos: Vector2;
  size: number;
  speed: number;
}

export interface PickedItem {
  type: ItemType;
  pos: Vector2;
}

export interface ActiveItemState {
  paddlePlusStacks: number;
  slowBallStacks: number;
  multiballStacks: number;
  shieldCharges: number;
  pierceStacks: number;
  bombStacks: number;
}

export interface ItemState {
  falling: FallingItem[];
  active: ActiveItemState;
  nextId: number;
}

export interface ProgressState {
  score: number;
  lives: number;
  elapsedSec: number;
  campaign: CampaignState;
  combo: ComboState;
  stageStats: StageStats;
}

export interface RuntimeState {
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  items: ItemState;
  assist: AssistState;
  vfx: VfxState;
  a11y: A11yState;
}

export type GameState = GameSceneState & ProgressState & RuntimeState;

interface GameSceneState {
  scene: Scene;
  errorMessage: string | null;
}

export interface ComboState {
  multiplier: number;
  streak: number;
  lastHitSec: number;
}

export interface StageStats {
  hitsTaken: number;
  startedAtSec: number;
  missionTargetSec: number;
  missionAchieved?: boolean;
  clearedAtSec?: number;
  starRating?: 1 | 2 | 3;
  ratingScore?: number;
}

export interface A11yState {
  reducedMotion: boolean;
  highContrast: boolean;
}
