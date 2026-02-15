import type { Ball } from "../types";

export function normalizeVelocity(ball: Ball, maxSpeed: number): void {
  const current = Math.hypot(ball.vel.x, ball.vel.y);
  if (current === 0) {
    return;
  }
  const factor = Math.min(maxSpeed, current) / current;
  ball.vel.x *= factor;
  ball.vel.y *= factor;
}
