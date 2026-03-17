import type {
  BossAttackKind,
  BrickKind,
  EncounterCueKind,
  EncounterKind,
  EncounterProfile,
  ItemType,
  ScoreFocus,
  StageMechanicRole,
  StagePreviewTag,
  ThreatLevel,
} from "../domainTypes";
import type { StageMissionStatus } from "./runState";

export interface StageStats {
  hitsTaken: number;
  startedAtSec: number;
  missionTargetSec: number;
  missionAchieved?: boolean;
  missionResults?: StageMissionStatus[];
  generatorShutdown?: boolean;
  firstDestroyedKind?: BrickKind;
  clearedAtSec?: number;
  starRating?: 1 | 2 | 3;
  ratingScore?: number;
  canceledShots?: number;
}

export interface ShopState {
  usedThisStage: boolean;
  purchaseCount: number;
  lastOffer: [ItemType, ItemType] | null;
  lastChosen: ItemType | null;
}

export interface StoryState {
  activeStageNumber: number | null;
  seenStageNumbers: number[];
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

export interface EncounterCue {
  kind: EncounterCueKind;
  remainingSec: number;
  maxSec: number;
  severity: ThreatLevel;
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

export interface EncounterSessionState {
  currentEncounterId: string | null;
  stats: StageStats;
  shop: ShopState;
  story: StoryState;
  threatLevel: ThreatLevel;
  activeTelegraphs: BossTelegraph[];
  rewardPreview: {
    stageNumber: number | null;
    previewTags: readonly StagePreviewTag[];
    scoreFocus: ScoreFocus | null;
  } | null;
  runtime: EncounterRuntimeState;
  bossPhase: 0 | 1 | 2 | 3;
  bossPhaseSummonCooldownSec: number;
  enemyWaveCooldownSec: number;
  forcedBallLoss: boolean;
}
