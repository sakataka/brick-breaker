import type { Difficulty } from "./uiTypes";

export type ItemType =
  | "paddle_plus"
  | "slow_ball"
  | "multiball"
  | "shield"
  | "pierce"
  | "bomb"
  | "laser"
  | "homing"
  | "rail"
  | "shockwave"
  | "pulse";

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
  cooldownSec?: number;
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
