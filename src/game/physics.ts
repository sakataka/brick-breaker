import type { Ball, Brick, Paddle, GameConfig } from './types';

const MAX_SUBSTEPS = 12;
const MAX_MOVE = 4;

export interface PhysicsResult {
  livesLost: number;
  cleared: boolean;
  scoreGain: number;
  collision: {
    wall: boolean;
    paddle: boolean;
    brick: number;
  };
}

export interface PhysicsConfig {
  maxMove?: number;
  maxSubSteps?: number;
}

export function stepPhysics(
  ball: Ball,
  paddle: Paddle,
  bricks: Brick[],
  config: GameConfig,
  deltaSec: number,
  stepConfig?: PhysicsConfig,
): PhysicsResult {
  const maxMove = stepConfig?.maxMove ?? MAX_MOVE;
  const maxSubSteps = stepConfig?.maxSubSteps ?? MAX_SUBSTEPS;

  const distance = Math.hypot(ball.vel.x, ball.vel.y) * deltaSec;
  const iterations = Math.min(maxSubSteps, Math.max(1, Math.ceil(distance / maxMove)));
  const subDt = deltaSec / iterations;

  const result: PhysicsResult = {
    livesLost: 0,
    cleared: false,
    scoreGain: 0,
    collision: {
      wall: false,
      paddle: false,
      brick: 0,
    },
  };

  for (let i = 0; i < iterations; i += 1) {
    integratePosition(ball, subDt);

    if (resolveWallCollision(ball, config, result.collision)) {
      result.livesLost = 1;
      return result;
    }

    if (resolvePaddleCollision(ball, paddle)) {
      applyPaddleCollision(ball, paddle, config);
      result.collision.paddle = true;
    }

    const hitBrickIndex = resolveBrickCollision(ball, bricks);
    if (hitBrickIndex >= 0) {
      const clearGain = applyBrickCollision(ball, bricks, hitBrickIndex, config);
      result.scoreGain += clearGain.scoreGain;
      result.collision.brick += 1;
      if (clearGain.cleared) {
        result.cleared = true;
      }
    }

    normalizeVelocity(ball, config.maxBallSpeed);
  }

  return result;
}

function integratePosition(ball: Ball, deltaSec: number): void {
  ball.pos.x += ball.vel.x * deltaSec;
  ball.pos.y += ball.vel.y * deltaSec;
}

function resolveWallCollision(
  ball: Ball,
  config: GameConfig,
  collision: PhysicsResult['collision'],
): boolean {
  if (ball.pos.x - ball.radius < 0) {
    ball.pos.x = ball.radius;
    ball.vel.x = Math.abs(ball.vel.x);
    collision.wall = true;
  } else if (ball.pos.x + ball.radius > config.width) {
    ball.pos.x = config.width - ball.radius;
    ball.vel.x = -Math.abs(ball.vel.x);
    collision.wall = true;
  }

  if (ball.pos.y - ball.radius < 0) {
    ball.pos.y = ball.radius;
    ball.vel.y = Math.abs(ball.vel.y);
    collision.wall = true;
    return false;
  }

  if (ball.pos.y - ball.radius > config.height) {
    return true;
  }

  return false;
}

function resolvePaddleCollision(ball: Ball, paddle: Paddle): boolean {
  if (ball.vel.y <= 0) {
    return false;
  }

  if (
    ball.pos.x + ball.radius < paddle.x ||
    ball.pos.x - ball.radius > paddle.x + paddle.width ||
    ball.pos.y + ball.radius < paddle.y ||
    ball.pos.y - ball.radius > paddle.y + paddle.height
  ) {
    return false;
  }

  const closestX = clamp(ball.pos.x, paddle.x, paddle.x + paddle.width);
  const closestY = clamp(ball.pos.y, paddle.y, paddle.y + paddle.height);
  const dx = ball.pos.x - closestX;
  const dy = ball.pos.y - closestY;

  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function applyPaddleCollision(ball: Ball, paddle: Paddle, config: GameConfig): void {
  ball.pos.y = paddle.y - ball.radius;
  const impact = Math.max(-1, Math.min(1, (ball.pos.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2));
  const angle = impact * (Math.PI / 3);
  const speed = Math.min(config.maxBallSpeed, Math.max(config.initialBallSpeed, Math.hypot(ball.vel.x, ball.vel.y)));
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
  config: GameConfig,
): { scoreGain: number; cleared: boolean } {
  const brick = bricks[hitBrickIndex];
  brick.alive = false;
  ball.speed = Math.min(config.maxBallSpeed, ball.speed + 4);

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

  const nextAlive = bricks.some((b) => b.alive);
  return {
    scoreGain: 100,
    cleared: !nextAlive,
  };
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

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
