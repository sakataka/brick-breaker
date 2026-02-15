import type { GameplayBalance } from "../config";
import { clamp } from "../math";
import type { Ball } from "../types";

export function updateStickyHold(
  ball: Ball,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  deltaSec: number,
  initialBallSpeed: number,
  balance: GameplayBalance,
  maxBallSpeed: number,
): void {
  const timer = Math.max(0, (ball.stickTimerSec ?? 0) - deltaSec);
  ball.stickTimerSec = timer;
  const ratio = clamp(ball.stickOffsetRatio ?? 0, -1, 1);
  ball.pos.x = paddleX + paddleWidth / 2 + ratio * (paddleWidth / 2);
  ball.pos.y = paddleY - ball.radius;
  ball.vel.x = 0;
  ball.vel.y = 0;
  if (timer > 0) {
    return;
  }
  const angle = ratio * balance.paddleMaxBounceAngle;
  const speed = Math.min(maxBallSpeed, Math.max(initialBallSpeed, ball.speed || initialBallSpeed));
  ball.vel.x = Math.sin(angle) * speed;
  ball.vel.y = -Math.cos(angle) * speed;
  ball.speed = speed;
}
