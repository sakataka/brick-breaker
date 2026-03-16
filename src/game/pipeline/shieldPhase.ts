import type { SfxManager } from "../../audio/sfx";
import { applyDirectBrickDamage } from "../brickDamage";
import { countsTowardStageClear } from "../brickRules";
import type { Ball, GameState, RandomSource } from "../types";

export interface ShieldBurstEvent {
  kind: "brick";
  x: number;
  y: number;
  color?: string;
  brickKind?: GameState["combat"]["bricks"][number]["kind"];
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
  state.ui.vfx.impactRings.push({
    pos: { x: state.combat.paddle.x + state.combat.paddle.width / 2, y: state.combat.paddle.y - 4 },
    radiusStart: 10,
    radiusEnd: 86,
    lifeMs: 220,
    maxLifeMs: 220,
    color: "rgba(120,255,230,0.88)",
  });
  state.ui.vfx.flashMs = Math.max(state.ui.vfx.flashMs, 110);
  state.ui.vfx.shakeMs = Math.max(state.ui.vfx.shakeMs, 70);
  state.ui.vfx.shakePx = Math.max(state.ui.vfx.shakePx, 3);

  for (const ball of survivors) {
    const upward = Math.max(260, Math.abs(ball.vel.y));
    ball.vel.y = -Math.min(maxBallSpeed, upward);
    if (Math.abs(ball.vel.x) < 24) {
      ball.vel.x = (random.next() * 2 - 1) * 80;
    }
    const nextSpeed = Math.hypot(ball.vel.x, ball.vel.y);
    ball.speed = Math.min(maxBallSpeed, Math.max(ball.speed, nextSpeed));
  }

  const candidates = state.combat.bricks
    .filter((brick) => brick.alive && countsTowardStageClear(brick))
    .sort((a, b) => {
      if (b.y !== a.y) {
        return b.y - a.y;
      }
      const center = state.combat.paddle.x + state.combat.paddle.width / 2;
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
