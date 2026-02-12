import type { Ball, Brick, Paddle, GameConfig } from './types';

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

export function stepPhysics(
  ball: Ball,
  paddle: Paddle,
  bricks: Brick[],
  config: GameConfig,
  deltaSec: number,
): PhysicsResult {
  const maxMove = 4;
  const distance = Math.hypot(ball.vel.x, ball.vel.y) * deltaSec;
  const iterations = Math.max(1, Math.ceil(distance / maxMove));
  const subDt = deltaSec / iterations;

  let livesLost = 0;
  let cleared = false;
  let scoreGain = 0;
  let brickHit = 0;
  let wallHit = false;
  let paddleHit = false;

  for (let i = 0; i < iterations; i += 1) {
    ball.pos.x += ball.vel.x * subDt;
    ball.pos.y += ball.vel.y * subDt;

    if (ball.pos.x - ball.radius < 0) {
      ball.pos.x = ball.radius;
      ball.vel.x = Math.abs(ball.vel.x);
      wallHit = true;
    } else if (ball.pos.x + ball.radius > config.width) {
      ball.pos.x = config.width - ball.radius;
      ball.vel.x = -Math.abs(ball.vel.x);
      wallHit = true;
    }

    if (ball.pos.y - ball.radius < 0) {
      ball.pos.y = ball.radius;
      ball.vel.y = Math.abs(ball.vel.y);
      wallHit = true;
    }

    if (ball.pos.y - ball.radius > config.height) {
      livesLost = 1;
      return {
        livesLost,
        cleared,
        scoreGain,
        collision: {
          wall: wallHit,
          paddle: paddleHit,
          brick: brickHit,
        },
      };
    }

    const hitPaddle = resolvePaddleCollision(ball, paddle);
    if (hitPaddle) {
      ball.pos.y = paddle.y - ball.radius;
      const impact = Math.max(
        -1,
        Math.min(1, (ball.pos.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)),
      );
      const angle = impact * (Math.PI / 3); // 60deg
      const speed = Math.min(config.maxBallSpeed, Math.max(config.initialBallSpeed, Math.hypot(ball.vel.x, ball.vel.y)));
      ball.vel.x = Math.sin(angle) * speed;
      ball.vel.y = -Math.cos(angle) * speed;
      paddleHit = true;
    }

    const hitBrickIndex = resolveBrickCollision(ball, bricks);
    if (hitBrickIndex >= 0) {
      const brick = bricks[hitBrickIndex];
      brick.alive = false;
      scoreGain += 100;
      brickHit += 1;
      ball.speed = Math.min(config.maxBallSpeed, ball.speed + 4);

      const nextAlive = bricks.some((b) => b.alive);
      if (!nextAlive) {
        cleared = true;
      }
    }

    normalizeVelocity(ball, config.maxBallSpeed);
  }

  return {
    livesLost,
    cleared,
    scoreGain,
    collision: {
      wall: wallHit,
      paddle: paddleHit,
      brick: brickHit,
    },
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

    return i;
  }
  return -1;
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
