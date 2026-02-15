import type { SfxManager } from "../../audio/sfx";
import { applyDirectBrickDamage } from "../brickDamage";
import type { Ball, GameState, RandomSource } from "../types";

export interface ShieldBurstEvent {
  kind: "brick";
  x: number;
  y: number;
  color?: string;
  brickKind?: GameState["bricks"][number]["kind"];
}

export function processShieldBurst(
  state: GameState,
  survivors: Ball[],
  maxBallSpeed: number,
  sfx: SfxManager,
  random: RandomSource,
): ShieldBurstEvent[] {
  if (!state.combat.shieldBurstQueued) {
    return [];
  }
  state.combat.shieldBurstQueued = false;
  void sfx.play("shield_burst");
  state.vfx.impactRings.push({
    pos: { x: state.paddle.x + state.paddle.width / 2, y: state.paddle.y - 4 },
    radiusStart: 10,
    radiusEnd: 86,
    lifeMs: 220,
    maxLifeMs: 220,
    color: "rgba(120,255,230,0.88)",
  });
  state.vfx.flashMs = Math.max(state.vfx.flashMs, 110);
  state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 70);
  state.vfx.shakePx = Math.max(state.vfx.shakePx, 3);

  for (const ball of survivors) {
    const upward = Math.max(260, Math.abs(ball.vel.y));
    ball.vel.y = -Math.min(maxBallSpeed, upward);
    if (Math.abs(ball.vel.x) < 24) {
      ball.vel.x = (random.next() * 2 - 1) * 80;
    }
    const nextSpeed = Math.hypot(ball.vel.x, ball.vel.y);
    ball.speed = Math.min(maxBallSpeed, Math.max(ball.speed, nextSpeed));
  }

  const candidates = state.bricks
    .filter((brick) => brick.alive)
    .sort((a, b) => {
      if (b.y !== a.y) {
        return b.y - a.y;
      }
      const center = state.paddle.x + state.paddle.width / 2;
      const da = Math.abs(a.x + a.width / 2 - center);
      const db = Math.abs(b.x + b.width / 2 - center);
      return da - db;
    })
    .slice(0, 2);

  const events: ShieldBurstEvent[] = [];
  for (const target of candidates) {
    if (!target.alive) {
      continue;
    }
    const destroyed = applyDirectBrickDamage(target);
    if (!destroyed) {
      continue;
    }
    events.push({
      kind: "brick",
      x: target.x + target.width / 2,
      y: target.y + target.height / 2,
      color: target.color ?? "rgba(120,255,230,0.9)",
      brickKind: target.kind ?? "normal",
    });
  }
  return events;
}
