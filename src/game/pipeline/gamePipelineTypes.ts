import type { SfxManager } from "../../audio/sfx";
import type { MultiBallPhysicsResult } from "../physicsApply";
import type { Ball, CollisionEvent, GameConfig, GameState, ItemType, RandomSource } from "../types";

export type PipelineOutcome = "continue" | "stageclear" | "ballloss";

export interface GamePipelineDeps {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  tryShieldRescue: (ball: Ball, maxSpeed: number) => boolean;
  playPickupSfx: (itemType: ItemType) => void;
  playComboFillSfx: () => void;
  playMagicCastSfx: () => void;
}

export interface TickContext {
  balance: ReturnType<typeof import("../config").getGameplayBalance>;
  hadAliveBricksBeforeTick: boolean;
  stageContext: ReturnType<typeof import("../stageContext").resolveStageContextFromState>;
  pipelineDeltaSec: number;
  maxWithAssist: number;
  effectiveMaxSpeed: number;
  pierceDepth: number;
  bombRadiusTiles: number;
  homingStrength: number;
  railLevel: number;
  laserLevel: number;
  scoreScale: number;
  scoreFocus: NonNullable<
    ReturnType<typeof import("../stageContext").resolveStageContextFromState>["stage"]["scoreFocus"]
  >;
}

export interface EncounterScriptPhaseResult {
  projectileEvents: CollisionEvent[];
  canceledShots: number;
  cancelScoreGain: number;
}

export interface CombatSimulationPhaseResult {
  physics: MultiBallPhysicsResult;
  destroyedBricks: number;
  firstDestroyedBrickKind: GameState["encounter"]["stats"]["firstDestroyedKind"];
  triggeredHazard: boolean;
  weakWindowActive: boolean;
  enemyScoreGain: number;
  eliteScorePenalty: number;
}

export interface CollisionPhaseResult {
  hadBallDrop: boolean;
  lostAllBalls: boolean;
  pickedMultiball: boolean;
  comboRewardBefore: boolean;
  comboFillBefore: boolean;
  physics: MultiBallPhysicsResult;
}

export interface ScoringPhaseResult {
  comboRewardTriggered: boolean;
  comboFillTriggered: boolean;
}
