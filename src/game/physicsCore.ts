import { type GameplayBalance, getGameplayBalance } from "./config";
import { clamp } from "./math";
import type { PhysicsFrameResult, PhysicsInput } from "./physicsTypes";
import type { Ball, Brick, CollisionEvent } from "./types";

const MAX_SUBSTEPS = 12;
const MAX_MOVE = 4;

interface BrickHitResult {
  scoreGain: number;
  destroyedCount: number;
  cleared: boolean;
  events: CollisionEvent[];
}

export function stepPhysicsCore({
  ball,
  paddle,
  bricks,
  config,
  deltaSec,
  stepConfig,
}: PhysicsInput): PhysicsFrameResult {
  const maxMove = stepConfig?.maxMove ?? MAX_MOVE;
  const maxSubSteps = stepConfig?.maxSubSteps ?? MAX_SUBSTEPS;
  const maxBallSpeed = stepConfig?.maxBallSpeed ?? config.maxBallSpeed;
  const initialBallSpeed = stepConfig?.initialBallSpeed ?? config.initialBallSpeed;
  const pierceDepth = Math.max(0, stepConfig?.pierceDepth ?? 0);
  const bombRadiusTiles = Math.max(0, stepConfig?.bombRadiusTiles ?? 0);
  const explodeOnHit = stepConfig?.explodeOnHit ?? false;
  const balance = stepConfig?.balance ?? getGameplayBalance(config.difficulty);

  const distance = Math.hypot(ball.vel.x, ball.vel.y) * deltaSec;
  const iterations = Math.min(maxSubSteps, Math.max(1, Math.ceil(distance / maxMove)));
  const subDt = deltaSec / iterations;

  const result: PhysicsFrameResult = {
    livesLost: 0,
    cleared: false,
    scoreGain: 0,
    events: [],
    collision: {
      wall: false,
      paddle: false,
      brick: 0,
    },
  };

  for (let i = 0; i < iterations; i += 1) {
    integratePosition(ball, subDt);

    if (
      resolveWallCollision(
        ball,
        config.width,
        config.height,
        result.collision,
        result.events,
        stepConfig?.onMiss,
      )
    ) {
      result.livesLost = 1;
      return result;
    }

    if (resolvePaddleCollision(ball, paddle.x, paddle.y, paddle.width, paddle.height)) {
      applyPaddleCollision(ball, paddle.x, paddle.y, paddle.width, initialBallSpeed, balance, maxBallSpeed);
      result.collision.paddle = true;
      result.events.push({
        kind: "paddle",
        x: ball.pos.x,
        y: paddle.y,
      });
    }

    let directHits = 0;
    while (true) {
      const hitBrickIndex = resolveBrickCollision(ball, bricks);
      if (hitBrickIndex < 0) {
        break;
      }

      const canPierce = directHits < pierceDepth;
      const hit = applyBrickCollision(ball, bricks, hitBrickIndex, balance, maxBallSpeed, {
        reflect: !canPierce,
        bombRadiusTiles: explodeOnHit ? bombRadiusTiles : 0,
      });
      if (hit.destroyedCount <= 0) {
        break;
      }

      result.scoreGain += hit.scoreGain;
      result.collision.brick += hit.destroyedCount;
      result.events.push(...hit.events);
      if (hit.cleared) {
        result.cleared = true;
      }

      directHits += 1;
      if (!canPierce) {
        break;
      }
      nudgeForward(ball);
    }

    normalizeVelocity(ball, maxBallSpeed);
  }

  return result;
}

function integratePosition(ball: Ball, deltaSec: number): void {
  ball.pos.x += ball.vel.x * deltaSec;
  ball.pos.y += ball.vel.y * deltaSec;
}

function resolveWallCollision(
  ball: Ball,
  worldWidth: number,
  worldHeight: number,
  collision: PhysicsFrameResult["collision"],
  events: CollisionEvent[],
  onMiss?: (ball: Ball) => boolean,
): boolean {
  let hasWallHit = false;
  if (ball.pos.x - ball.radius < 0) {
    ball.pos.x = ball.radius;
    ball.vel.x = Math.abs(ball.vel.x);
    collision.wall = true;
    hasWallHit = true;
  } else if (ball.pos.x + ball.radius > worldWidth) {
    ball.pos.x = worldWidth - ball.radius;
    ball.vel.x = -Math.abs(ball.vel.x);
    collision.wall = true;
    hasWallHit = true;
  }

  if (ball.pos.y - ball.radius < 0) {
    ball.pos.y = ball.radius;
    ball.vel.y = Math.abs(ball.vel.y);
    collision.wall = true;
    hasWallHit = true;
  }

  if (hasWallHit) {
    events.push({
      kind: "wall",
      x: ball.pos.x,
      y: ball.pos.y,
    });
  }

  if (ball.pos.y - ball.radius > worldHeight) {
    if (onMiss?.(ball)) {
      collision.wall = true;
      events.push({
        kind: "wall",
        x: ball.pos.x,
        y: worldHeight,
      });
      return false;
    }
    events.push({
      kind: "miss",
      x: ball.pos.x,
      y: worldHeight,
    });
    return true;
  }

  return false;
}

function resolvePaddleCollision(
  ball: Ball,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  paddleHeight: number,
): boolean {
  if (ball.vel.y <= 0) {
    return false;
  }

  if (
    ball.pos.x + ball.radius < paddleX ||
    ball.pos.x - ball.radius > paddleX + paddleWidth ||
    ball.pos.y + ball.radius < paddleY ||
    ball.pos.y - ball.radius > paddleY + paddleHeight
  ) {
    return false;
  }

  const closestX = clamp(ball.pos.x, paddleX, paddleX + paddleWidth);
  const closestY = clamp(ball.pos.y, paddleY, paddleY + paddleHeight);
  const dx = ball.pos.x - closestX;
  const dy = ball.pos.y - closestY;

  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function applyPaddleCollision(
  ball: Ball,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  initialBallSpeed: number,
  balance: GameplayBalance,
  maxBallSpeed: number,
): void {
  ball.pos.y = paddleY - ball.radius;
  const relativeX = (ball.pos.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
  const impact = Math.max(-1, Math.min(1, relativeX));
  const angle = impact * balance.paddleMaxBounceAngle;
  const speed = Math.min(maxBallSpeed, Math.max(initialBallSpeed, Math.hypot(ball.vel.x, ball.vel.y)));
  ball.vel.x = Math.sin(angle) * speed;
  ball.vel.y = -Math.cos(angle) * speed;
}

function resolveBrickCollision(ball: Ball, bricks: Brick[]): number {
  for (let i = 0; i < bricks.length; i += 1) {
    const brick = bricks[i];
    if (!brick.alive) {
      continue;
    }

    if (
      ball.pos.x + ball.radius < brick.x ||
      ball.pos.x - ball.radius > brick.x + brick.width ||
      ball.pos.y + ball.radius < brick.y ||
      ball.pos.y - ball.radius > brick.y + brick.height
    ) {
      continue;
    }

    const closestX = clamp(ball.pos.x, brick.x, brick.x + brick.width);
    const closestY = clamp(ball.pos.y, brick.y, brick.y + brick.height);
    const dx = ball.pos.x - closestX;
    const dy = ball.pos.y - closestY;

    if (dx * dx + dy * dy > ball.radius * ball.radius) {
      continue;
    }

    return i;
  }

  return -1;
}

function applyBrickCollision(
  ball: Ball,
  bricks: Brick[],
  hitBrickIndex: number,
  balance: GameplayBalance,
  maxBallSpeed: number,
  options: {
    reflect: boolean;
    bombRadiusTiles: number;
  },
): BrickHitResult {
  const brick = bricks[hitBrickIndex];
  if (!brick.alive) {
    return {
      scoreGain: 0,
      destroyedCount: 0,
      cleared: !bricks.some((candidate) => candidate.alive),
      events: [],
    };
  }

  const destroyed: Brick[] = [];
  damageBrick(brick, "direct", destroyed);

  if (options.bombRadiusTiles > 0) {
    damageExplodedBricks(bricks, brick, options.bombRadiusTiles, destroyed);
  }

  ball.speed = Math.min(maxBallSpeed, ball.speed + balance.brickHitSpeedGain);

  if (options.reflect) {
    const hitX = clamp(ball.pos.x, brick.x, brick.x + brick.width);
    const hitY = clamp(ball.pos.y, brick.y, brick.y + brick.height);
    const dx = ball.pos.x - hitX;
    const dy = ball.pos.y - hitY;

    if (Math.abs(dx) > Math.abs(dy)) {
      ball.vel.x = -ball.vel.x;
      if (dx > 0) {
        ball.pos.x = brick.x + brick.width + ball.radius;
      } else {
        ball.pos.x = brick.x - ball.radius;
      }
    } else {
      ball.vel.y = -ball.vel.y;
      if (dy > 0) {
        ball.pos.y = brick.y + brick.height + ball.radius;
      } else {
        ball.pos.y = brick.y - ball.radius;
      }
    }
  }

  const scoreGain = destroyed.length * balance.scorePerBrick;
  const events = destroyed.map((target) => ({
    kind: "brick" as const,
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
    color: target.color,
    brickKind: target.kind ?? "normal",
  }));

  return {
    scoreGain,
    destroyedCount: destroyed.length,
    cleared: !bricks.some((candidate) => candidate.alive),
    events,
  };
}

type BrickDamageSource = "direct" | "explosion";

function damageBrick(brick: Brick, source: BrickDamageSource, destroyed: Brick[]): void {
  if (!brick.alive) {
    return;
  }

  const kind = brick.kind ?? "normal";
  const defaultHp = kind === "normal" || kind === "hazard" ? 1 : 2;
  const currentHp = typeof brick.hp === "number" && Number.isFinite(brick.hp) ? brick.hp : defaultHp;
  const nextHp = Math.max(0, currentHp - 1);

  if (source === "explosion" && kind === "armored") {
    brick.hp = Math.max(1, nextHp);
    return;
  }

  if (source === "direct" && kind === "regen" && nextHp === 1) {
    const regenCharges = Math.max(0, brick.regenCharges ?? 1);
    if (regenCharges > 0) {
      brick.regenCharges = regenCharges - 1;
      brick.hp = 2;
      return;
    }
  }

  brick.hp = nextHp;
  if (brick.hp > 0) {
    return;
  }

  brick.alive = false;
  destroyed.push(brick);
}

function damageExplodedBricks(bricks: Brick[], center: Brick, radiusTiles: number, destroyed: Brick[]): void {
  for (const candidate of bricks) {
    if (!candidate.alive || candidate.id === center.id) {
      continue;
    }

    if (isWithinExplosionRange(candidate, center, radiusTiles)) {
      damageBrick(candidate, "explosion", destroyed);
    }
  }
}

function isWithinExplosionRange(candidate: Brick, center: Brick, radiusTiles: number): boolean {
  if (
    typeof candidate.row === "number" &&
    typeof candidate.col === "number" &&
    typeof center.row === "number" &&
    typeof center.col === "number"
  ) {
    return (
      Math.abs(candidate.row - center.row) <= radiusTiles &&
      Math.abs(candidate.col - center.col) <= radiusTiles
    );
  }

  const centerX = center.x + center.width / 2;
  const centerY = center.y + center.height / 2;
  const candidateX = candidate.x + candidate.width / 2;
  const candidateY = candidate.y + candidate.height / 2;
  const tileW = Math.max(1, center.width);
  const tileH = Math.max(1, center.height);

  return (
    Math.abs(candidateX - centerX) <= tileW * radiusTiles + tileW * 0.5 &&
    Math.abs(candidateY - centerY) <= tileH * radiusTiles + tileH * 0.5
  );
}

function nudgeForward(ball: Ball): void {
  const speed = Math.hypot(ball.vel.x, ball.vel.y);
  if (speed <= 0) {
    return;
  }
  const push = ball.radius * 0.55;
  ball.pos.x += (ball.vel.x / speed) * push;
  ball.pos.y += (ball.vel.y / speed) * push;
}

function normalizeVelocity(ball: Ball, maxSpeed: number): void {
  const current = Math.hypot(ball.vel.x, ball.vel.y);
  if (current === 0) {
    return;
  }
  const factor = Math.min(maxSpeed, current) / current;
  ball.vel.x *= factor;
  ball.vel.y *= factor;
}
