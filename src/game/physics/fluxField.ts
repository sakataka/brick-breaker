import { clamp } from "../math";
import type { Ball } from "../types";

const FLUX_RADIUS = 180;
const FLUX_PULL_ACCEL = 340;
const FLUX_PUSH_ACCEL = 220;
const FLUX_DELTA_V_LIMIT = 180;

export function applyFluxField(
  ball: Ball,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  deltaSec: number,
): void {
  const paddleCenterX = paddleX + paddleWidth / 2;
  const paddleCenterY = paddleY;
  const dx = paddleCenterX - ball.pos.x;
  const dy = paddleCenterY - ball.pos.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0 || distance > FLUX_RADIUS) {
    return;
  }
  const weight = 1 - distance / FLUX_RADIUS;
  const towardCenter = dx / distance;
  const direction = ball.vel.y >= 0 ? towardCenter : -towardCenter;
  const accel = (ball.vel.y >= 0 ? FLUX_PULL_ACCEL : FLUX_PUSH_ACCEL) * weight;
  const deltaVx = clamp(
    direction * accel * deltaSec,
    -FLUX_DELTA_V_LIMIT * deltaSec,
    FLUX_DELTA_V_LIMIT * deltaSec,
  );
  ball.vel.x += deltaVx;
}
