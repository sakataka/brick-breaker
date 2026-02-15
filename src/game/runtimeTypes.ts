import type { Ball, Brick, BrickKind, ItemType, Paddle, Scene, Vector2 } from "./domainTypes";

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
  brickKind?: BrickKind;
}

export interface CampaignState {
  stageIndex: number;
  totalStages: number;
  stageStartScore: number;
  results: StageResultEntry[];
  routePreference: RoutePreference;
  resolvedRoute: StageRoute | null;
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
  laserStacks: number;
  stickyStacks: number;
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
  options: RunOptions;
}

export interface RuntimeState {
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  combat: CombatState;
  enemies: EnemyUnit[];
  magic: MagicState;
  items: ItemState;
  assist: AssistState;
  hazard: HazardState;
  shop: ShopState;
  rogue: RogueState;
  story: StoryState;
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
  rewardGranted: boolean;
  fillTriggered: boolean;
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

export interface HazardState {
  speedBoostUntilSec: number;
}

export interface RunOptions {
  riskMode: boolean;
  enableNewItemStacks: boolean;
  debugModeEnabled: boolean;
  debugRecordResults: boolean;
  debugScenario: DebugScenario;
  debugItemPreset: DebugItemPreset;
}

export type DebugScenario = "normal" | "enemy_check" | "boss_check";
export type DebugItemPreset = "none" | "combat_check" | "boss_check";

export interface ShopState {
  usedThisStage: boolean;
  lastOffer: [ItemType, ItemType] | null;
  lastChosen: ItemType | null;
}

export interface MagicState {
  cooldownSec: number;
  requestCast: boolean;
  cooldownMaxSec: number;
}

export interface RogueState {
  upgradesTaken: number;
  paddleScaleBonus: number;
  maxSpeedScaleBonus: number;
  scoreScaleBonus: number;
  pendingOffer: [RogueUpgradeType, RogueUpgradeType] | null;
  lastChosen: RogueUpgradeType | null;
}

export interface StoryState {
  activeStageNumber: number | null;
  seenStageNumbers: number[];
}

export type RoutePreference = "auto" | "A" | "B";
export type StageRoute = "A" | "B";
export type RogueUpgradeType = "paddle_core" | "speed_core" | "score_core";

export interface EnemyUnit {
  id: number;
  x: number;
  y: number;
  vx: number;
  radius: number;
  alive: boolean;
}

export interface LaserProjectile {
  id: number;
  x: number;
  y: number;
  speed: number;
}

export interface HeldBallState {
  xOffsetRatio: number;
  remainingSec: number;
}

export interface CombatState {
  laserCooldownSec: number;
  nextLaserId: number;
  laserProjectiles: LaserProjectile[];
  heldBalls: HeldBallState[];
  shieldBurstQueued: boolean;
}
