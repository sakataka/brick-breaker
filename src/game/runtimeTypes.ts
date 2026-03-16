import type {
  Ball,
  BossAttackKind,
  Brick,
  BrickKind,
  EnemyShotProfile,
  EncounterCueKind,
  EncounterKind,
  EncounterProfile,
  ItemType,
  Paddle,
  ScoreFocus,
  Scene,
  StageMechanicRole,
  StageMissionKey,
  StageBonusRule,
  ThreatLevel,
  Vector2,
} from "./domainTypes";

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
  key: FloatingTextKey;
  itemType?: ItemType;
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
  flashColor: string;
  shakeMs: number;
  shakePx: number;
  hitFreezeMs: number;
  shakeOffset: Vector2;
  trail: Vector2[];
  densityScale: number;
  reducedMotion: boolean;
  pickupAuraMs: number;
  pickupAuraColor: string;
  pickupToast: {
    itemType: ItemType;
    color: string;
    lifeMs: number;
    maxLifeMs: number;
  } | null;
}

export type CollisionEventKind = "wall" | "paddle" | "brick" | "miss";

export interface CollisionEvent {
  kind: CollisionEventKind;
  x: number;
  y: number;
  color?: string;
  brickKind?: BrickKind;
  brickId?: number;
}

export interface RunProgressState {
  encounterIndex: number;
  totalEncounters: number;
  encounterStartScore: number;
  results: StageResultEntry[];
  unlockedThreatTier: 1 | 2;
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
  homingStacks: number;
  railStacks: number;
  shockwaveStacks: number;
  pulseStacks: number;
}

export interface ItemState {
  falling: FallingItem[];
  active: ActiveItemState;
  nextId: number;
}

export interface RunModulePolicy {
  enabledTypes: ItemType[];
  allowExtendedStacks: boolean;
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

export interface EncounterSessionState {
  currentEncounterId: string | null;
  stats: StageStats;
  shop: ShopState;
  story: StoryState;
  threatLevel: ThreatLevel;
  activeTelegraphs: BossTelegraph[];
  rewardPreview: {
    stageNumber: number | null;
    previewTags: readonly import("./domainTypes").StagePreviewTag[];
    scoreFocus: ScoreFocus | null;
  } | null;
  runtime: EncounterRuntimeState;
  bossPhase: 0 | 1 | 2 | 3;
  bossPhaseSummonCooldownSec: number;
  enemyWaveCooldownSec: number;
  forcedBallLoss: boolean;
}

export interface CombatState {
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  enemies: EnemyUnit[];
  laserCooldownSec: number;
  nextLaserId: number;
  laserProjectiles: LaserProjectile[];
  heldBalls: HeldBallState[];
  shieldBurstQueued: boolean;
  magic: MagicState;
  items: ItemState;
  assist: AssistState;
  hazard: HazardState;
  enemyProjectileStyle: {
    defaultProfile: EnemyShotProfile;
    turretProfile: EnemyShotProfile;
    bossProfile: EnemyShotProfile;
  };
}

export interface UiProjectionSource {
  vfx: VfxState;
  a11y: A11yState;
  scoreFeed: ScoreFeedEntry[];
  styleBonus: StyleBonusState;
  error: {
    key: RuntimeErrorKey;
    detail?: string;
  } | null;
}

export interface GameState {
  scene: Scene;
  run: RunState;
  encounter: EncounterSessionState;
  combat: CombatState;
  ui: UiProjectionSource;
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
  missionResults?: StageMissionStatus[];
  generatorShutdown?: boolean;
  firstDestroyedKind?: import("./domainTypes").BrickKind;
  clearedAtSec?: number;
  starRating?: 1 | 2 | 3;
  ratingScore?: number;
  canceledShots?: number;
}

export interface RecordState {
  overallBestScore: number;
  tier1BestScore: number;
  tier2BestScore: number;
  latestRunScore: number;
  currentRunRecord: boolean;
  deltaToBest: number;
}

export interface ScoreFeedEntry {
  id: number;
  label: string;
  amount: number;
  lifeMs: number;
  maxLifeMs: number;
  tone: "score" | "style" | "record";
}

export interface StyleBonusState {
  stageFocus: ScoreFocus;
  bonusRules: readonly StageBonusRule[];
  chainLevel: number;
  lastBonusLabel: string | null;
  lastBonusScore: number;
  noDropChainActive: boolean;
}

export type FloatingTextKey =
  | "item_pickup"
  | "reinforce"
  | "generator"
  | "gate"
  | "turret"
  | "split"
  | "summon"
  | "thorns"
  | "spell"
  | "boss_phase_2"
  | "boss_phase_3"
  | "boss_warning";
export type RuntimeErrorKey =
  | "initialization"
  | "gameStart"
  | "startAction"
  | "shopPurchase"
  | "runtime";

export interface StageMissionStatus {
  key: StageMissionKey;
  targetSec?: number;
  achieved: boolean;
}

export interface A11yState {
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface HazardState {
  speedBoostUntilSec: number;
}

export interface RunOptions {
  threatTier: 1 | 2;
  difficulty: import("./domainTypes").Difficulty;
  reducedMotionEnabled: boolean;
  highContrastEnabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface ShopState {
  usedThisStage: boolean;
  purchaseCount: number;
  lastOffer: [ItemType, ItemType] | null;
  lastChosen: ItemType | null;
}

export interface MagicState {
  cooldownSec: number;
  requestCast: boolean;
  cooldownMaxSec: number;
}

export interface StoryState {
  activeStageNumber: number | null;
  seenStageNumbers: number[];
}

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

export type BossLane = "left" | "center" | "right";

export interface BossProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  source?: "boss" | "turret";
}

export interface BossTelegraph {
  kind: BossAttackKind;
  remainingSec: number;
  maxSec: number;
  lane?: BossLane;
  targetX?: number;
  spread?: number;
  severity?: ThreatLevel;
}

export interface BossSweepState {
  lane: BossLane;
  remainingSec: number;
  maxSec: number;
}

export interface BossAttackState {
  actionCooldownSec: number;
  nextProjectileId: number;
  telegraph: BossTelegraph | null;
  projectiles: BossProjectile[];
  sweep: BossSweepState | null;
}

export interface EncounterRuntimeState extends BossAttackState {
  kind: EncounterKind;
  profile: EncounterProfile;
  phase: 0 | 1 | 2 | 3;
  summonCooldownSec: number;
  vulnerabilitySec: number;
  vulnerabilityMaxSec: number;
  stageThreatLevel: ThreatLevel;
  activeMechanics: StageMechanicRole[];
  activeCues: EncounterCue[];
  cueCursor: number;
  triggeredTimelineEvents: string[];
  lastTriggeredPhase: 0 | 1 | 2 | 3;
}

export interface EncounterCue {
  kind: EncounterCueKind;
  remainingSec: number;
  maxSec: number;
  severity: ThreatLevel;
}
