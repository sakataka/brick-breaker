import type { Ball, EnemyShotProfile, ItemType, Paddle, Vector2, Brick } from "../domainTypes";

export interface AssistState {
  untilSec: number;
  paddleScale: number;
  maxSpeedScale: number;
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

export interface HazardState {
  speedBoostUntilSec: number;
}

export interface MagicState {
  cooldownSec: number;
  requestCast: boolean;
  cooldownMaxSec: number;
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
