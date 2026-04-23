export type Scene =
  | "start"
  | "story"
  | "playing"
  | "paused"
  | "stageclear"
  | "clear"
  | "gameover"
  | "error";

export type Difficulty = "casual" | "standard" | "hard";
export type ThreatLevel = "low" | "medium" | "high" | "critical";
export type ThemeBandId = "chapter1" | "chapter2" | "chapter3" | "midboss" | "finalboss" | "tier2";
export type MusicCueId = ThemeBandId | "title";
export type PublicThreatTier = 1 | 2;
export type ScoreFocus = "survival_chain" | "reactor_chain" | "turret_cancel" | "boss_break";
export type StagePreviewTag =
  | "shielded_grid"
  | "relay_chain"
  | "reactor_chain"
  | "turret_lane"
  | "hazard_flux"
  | "gate_pressure"
  | "boss_break"
  | "survival_check"
  | "fortress_core"
  | "sweep_alert";
export type BossAttackKind = "summon" | "volley" | "sweep" | "burst" | "gate_sweep";
export type BossLane = "left" | "center" | "right";
export type EnemyShotProfile = "standard" | "plasma_bolt" | "void_core";
export type EncounterCueKind = "warning" | "pressure" | "boss" | "shop";
export type RuntimeErrorKey =
  | "initialization"
  | "gameStart"
  | "startAction"
  | "shopPurchase"
  | "runtime";
export type StageModifierKey = "warp_zone" | "speed_ball" | "enemy_flux" | "flux";
export type BrickKind =
  | "normal"
  | "steel"
  | "generator"
  | "gate"
  | "turret"
  | "durable"
  | "armored"
  | "regen"
  | "hazard"
  | "boss"
  | "split"
  | "summon"
  | "thorns";
export type ItemType =
  | "paddle_plus"
  | "slow_ball"
  | "shield"
  | "multiball"
  | "pierce"
  | "bomb"
  | "shockwave"
  | "pulse"
  | "laser"
  | "homing"
  | "rail";
export type ItemRoleTag = "attack" | "defense" | "control";
export type MusicCue = {
  id: MusicCueId;
  variant: number;
};

export interface Vector2 {
  x: number;
  y: number;
}

export interface RandomSource {
  next: () => number;
}

export interface GameAudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface GameConfig {
  width: number;
  height: number;
  fixedDeltaSec: number;
  difficulty: Difficulty;
  initialLives: number;
  initialBallSpeed: number;
  maxBallSpeed: number;
  multiballMaxBalls: number;
  assistDurationSec: number;
  assistPaddleScale: number;
  assistMaxSpeedScale: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball {
  id: number;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  speed: number;
}

export interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  color?: string;
  row?: number;
  hp?: number;
  maxHp?: number;
  kind?: BrickKind;
}

export interface FallingItem {
  id: number;
  type: ItemType;
  pos: Vector2;
  size: number;
}

export interface Particle {
  pos: Vector2;
  color: string;
  size: number;
  lifeMs: number;
  maxLifeMs: number;
}

export interface ImpactRing {
  pos: Vector2;
  color: string;
  radiusStart: number;
  radiusEnd: number;
  lifeMs: number;
  maxLifeMs: number;
}

export interface FloatingText {
  pos: Vector2;
  color: string;
  lifeMs: number;
  maxLifeMs: number;
}

export interface StageMissionStatus {
  key: StageMissionKey;
  achieved: boolean;
  detail?: string;
  targetSec?: number;
}

export type StageMissionKey =
  | "time_limit"
  | "no_shop"
  | "no_miss_stage"
  | "combo_x2"
  | "destroy_turret_first"
  | "shutdown_generator";

export interface RunProgressState {
  currentEncounterIndex: number;
  totalEncounters: number;
  currentStageNumber: number;
}

export interface RunRecordState {
  currentRunRecord: boolean;
  deltaToBest: number;
  courseBestScore: number;
}

export interface ActiveItemState {
  type: ItemType;
  count: number;
}

export interface RunState {
  threatTier: PublicThreatTier;
  progress: RunProgressState;
  score: number;
  lives: number;
  elapsedSec: number;
  comboMultiplier: number;
  comboWindowSec: number;
  comboWindowRemainingSec: number;
  activeItems: ActiveItemState[];
  record: RunRecordState;
  stageResults: StageResultState[];
}

export interface ShopOfferState {
  options: readonly [ItemType, ItemType];
  cost: number;
}

export interface BossState {
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  intent?: BossAttackKind;
  telegraphProgress: number;
  attackProgress: number;
  punishProgress: number;
  lane?: BossLane;
  targetX?: number;
  spread?: number;
  shotProfile: EnemyShotProfile;
}

export interface EncounterState {
  id: string;
  stageNumber: number;
  label: string;
  elapsedSec: number;
  scoreFocus: ScoreFocus;
  previewTags: readonly StagePreviewTag[];
  threatLevel: ThreatLevel;
  themeId: ThemeBandId;
  climax: "none" | "midboss" | "boss" | "tier2_boss";
  objective: "stop-first-threat" | "route-control" | "break-window" | "score-window";
  modifierKey?: StageModifierKey;
  shop: {
    purchased: boolean;
    lastOffer: ShopOfferState | null;
  };
  boss: BossState | null;
}

export interface CombatState {
  paddle: Paddle;
  balls: Ball[];
  bricks: Brick[];
  activeSkill: {
    cooldownSec: number;
    remainingCooldownSec: number;
  };
  trail: Vector2[];
  particles: Particle[];
  impactRings: ImpactRing[];
  floatingTexts: FloatingText[];
  fallingItems: FallingItem[];
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
    source?: "boss" | "turret";
    style: EnemyShotProfile;
  }>;
  flashMs: number;
}

export interface UiState {
  a11y: {
    reducedMotion: boolean;
    highContrast: boolean;
  };
  warningLevel: "calm" | "elevated" | "critical";
  overlayError?: {
    key: RuntimeErrorKey;
    detail?: string;
  };
  pickupToast?: {
    type: ItemType;
    color: string;
    progress: number;
  };
}

export interface StageResultState {
  stageNumber: number;
  stars: 1 | 2 | 3;
  ratingScore: number;
  clearTimeSec: number;
  hitsTaken: number;
  livesLeft: number;
  missionTargetSec: number;
  missionAchieved: boolean;
  missionResults: StageMissionStatus[];
}

export interface GameState {
  scene: Scene;
  run: RunState;
  encounter: EncounterState;
  combat: CombatState;
  ui: UiState;
}
