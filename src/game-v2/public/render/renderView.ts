import type {
  Ball,
  BossAttackKind,
  BossLane,
  Brick,
  EncounterCueKind,
  EnemyShotProfile,
  FallingItem,
  FloatingText,
  ImpactRing,
  Particle,
  Scene,
  StageModifierKey,
  ThemeBandId,
  ThreatLevel,
  Vector2,
} from "../types";
import type { VisualState } from "../uiTheme";

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
  visual: VisualState;
  arena: {
    depth: "stellar" | "orbital" | "fortress";
    frame: "clean" | "hazard" | "citadel";
    blockMaterial: "glass" | "alloy" | "armor" | "core";
    particleDensity: number;
    cameraIntensity: "steady" | "alert" | "assault";
    threatLevel: ThreatLevel;
  };
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
    source?: "boss" | "turret";
    style: EnemyShotProfile;
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
  activeCues: Array<{
    kind: EncounterCueKind;
    severity: ThreatLevel;
    progress: number;
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
  paddleAuraColor?: string;
  ballAuraColor?: string;
}
