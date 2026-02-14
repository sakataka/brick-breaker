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

export interface ActiveTimedEffect {
  type: Exclude<ItemType, "shield">;
  untilSec: number;
}

export interface ShieldState {
  untilSec: number;
  remainingHits: number;
}

export interface ActiveItemState {
  paddlePlus: ActiveTimedEffect;
  slowBall: ActiveTimedEffect;
  multiball: ActiveTimedEffect;
  shield: ShieldState;
}

export interface ItemState {
  falling: FallingItem[];
  active: ActiveItemState;
  nextId: number;
}

export interface GameState {
  scene: Scene;
  score: number;
  lives: number;
  elapsedSec: number;
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  campaign: CampaignState;
  items: ItemState;
  assist: AssistState;
  vfx: VfxState;
  errorMessage: string | null;
}
