export type Scene = "start" | "story" | "playing" | "paused" | "gameover" | "stageclear" | "clear" | "error";
export type Difficulty = "casual" | "standard" | "hard";
export type ItemType =
  | "paddle_plus"
  | "slow_ball"
  | "multiball"
  | "shield"
  | "pierce"
  | "bomb"
  | "laser"
  | "sticky"
  | "homing"
  | "rail";
export type BrickKind =
  | "normal"
  | "durable"
  | "armored"
  | "regen"
  | "hazard"
  | "boss"
  | "split"
  | "summon"
  | "thorns";

export interface Vector2 {
  x: number;
  y: number;
}

export interface RandomSource {
  next(): number;
}

export interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  speed: number;
  lastDamageBrickId?: number;
  warpCooldownSec?: number;
  stickTimerSec?: number;
  stickCooldownSec?: number;
  stickOffsetRatio?: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  kind?: BrickKind;
  hp?: number;
  maxHp?: number;
  regenCharges?: number;
  row?: number;
  col?: number;
  color?: string;
}

export interface GameConfig {
  width: number;
  height: number;
  difficulty: Difficulty;
  fixedDeltaSec: number;
  initialLives: number;
  initialBallSpeed: number;
  maxBallSpeed: number;
  multiballMaxBalls: number;
  assistDurationSec: number;
  assistPaddleScale: number;
  assistMaxSpeedScale: number;
}

export interface GameAudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface StageDefinition {
  id: number;
  speedScale: number;
  layout: number[][];
  elite?: StageElitePlacement[];
}

export interface StageElitePlacement {
  row: number;
  col: number;
  kind: Extract<
    BrickKind,
    "durable" | "armored" | "regen" | "hazard" | "boss" | "split" | "summon" | "thorns"
  >;
}
