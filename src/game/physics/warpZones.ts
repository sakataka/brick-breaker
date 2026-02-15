import type { WarpZone } from "../config/stages";
import type { Ball } from "../types";

const WARP_COOLDOWN_SEC = 0.24;
const WARP_EXIT_PUSH = 10;

export function applyWarpZones(ball: Ball, zones: WarpZone[] | undefined): void {
  if (!zones || zones.length <= 0) {
    return;
  }
  if ((ball.warpCooldownSec ?? 0) > 0) {
    return;
  }
  for (const zone of zones) {
    if (isInsideWarpZone(ball, zone)) {
      ball.pos.x = zone.outX;
      ball.pos.y = zone.outY;
      pushWarpExit(ball, zones);
      ball.warpCooldownSec = WARP_COOLDOWN_SEC;
      return;
    }
  }
}

function isInsideWarpZone(ball: Ball, zone: WarpZone): boolean {
  return (
    ball.pos.x >= zone.inXMin &&
    ball.pos.x <= zone.inXMax &&
    ball.pos.y >= zone.inYMin &&
    ball.pos.y <= zone.inYMax
  );
}

function pushWarpExit(ball: Ball, zones: WarpZone[]): void {
  const speed = Math.hypot(ball.vel.x, ball.vel.y);
  if (speed > 0) {
    ball.pos.x += (ball.vel.x / speed) * WARP_EXIT_PUSH;
    ball.pos.y += (ball.vel.y / speed) * WARP_EXIT_PUSH;
  }
  for (let i = 0; i < 4; i += 1) {
    const occupied = zones.some((zone) => isInsideWarpZone(ball, zone));
    if (!occupied) {
      return;
    }
    ball.pos.y += WARP_EXIT_PUSH;
    ball.pos.x += speed > 0 ? (ball.vel.x / speed) * (WARP_EXIT_PUSH * 0.6) : 0;
  }
}
