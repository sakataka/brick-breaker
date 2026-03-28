import { ITEM_REGISTRY } from "../public/items";
import type { BossLane, GameConfig, GameState } from "../public/types";
import { clamp } from "../public/math";

export function tickGame(state: GameState, config: GameConfig, deltaSec: number): void {
  state.run.elapsedSec += deltaSec;
  state.combat.flashMs = Math.max(0, state.combat.flashMs - deltaSec * 1000);
  if (state.ui.pickupToast) {
    state.ui.pickupToast.progress = Math.max(0, state.ui.pickupToast.progress - deltaSec * 0.9);
    if (state.ui.pickupToast.progress <= 0) {
      state.ui.pickupToast = undefined;
    }
  }
  tickBalls(state, config, deltaSec);
  tickBossCycle(state);
  tickVisualWarnings(state);
}

function tickBalls(state: GameState, config: GameConfig, deltaSec: number): void {
  state.combat.trail = [];
  const balls = state.combat.balls;
  for (const ball of balls) {
    state.combat.trail.push({ x: ball.pos.x, y: ball.pos.y });
    ball.pos.x += ball.vel.x * deltaSec;
    ball.pos.y += ball.vel.y * deltaSec;

    if (ball.pos.x <= ball.radius || ball.pos.x >= config.width - ball.radius) {
      ball.vel.x *= -1;
      ball.pos.x = clamp(ball.pos.x, ball.radius, config.width - ball.radius);
    }
    if (ball.pos.y <= ball.radius + 48) {
      ball.vel.y = Math.abs(ball.vel.y);
      ball.pos.y = ball.radius + 48;
    }
    if (ball.pos.y >= config.height - ball.radius) {
      state.run.lives = Math.max(0, state.run.lives - 1);
      if (state.run.lives <= 0) {
        state.scene = "gameover";
        return;
      }
      ball.pos.x = state.combat.paddle.x + state.combat.paddle.width / 2;
      ball.pos.y = state.combat.paddle.y - 18;
      ball.vel.y = -Math.abs(ball.vel.y);
    }

    if (
      ball.pos.y + ball.radius >= state.combat.paddle.y &&
      ball.pos.y - ball.radius <= state.combat.paddle.y + state.combat.paddle.height &&
      ball.pos.x >= state.combat.paddle.x &&
      ball.pos.x <= state.combat.paddle.x + state.combat.paddle.width &&
      ball.vel.y > 0
    ) {
      const offset =
        (ball.pos.x - (state.combat.paddle.x + state.combat.paddle.width / 2)) /
        (state.combat.paddle.width / 2);
      ball.vel.x = ball.speed * offset;
      ball.vel.y = -Math.abs(ball.speed * (0.8 + Math.abs(offset) * 0.2));
      ball.pos.y = state.combat.paddle.y - ball.radius;
    }

    for (const brick of state.combat.bricks) {
      if (!brick.alive || brick.kind === "steel" || brick.kind === "gate") {
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
      brick.hp = Math.max(0, (brick.hp ?? 1) - 1);
      if ((brick.hp ?? 0) <= 0) {
        brick.alive = false;
      }
      ball.vel.y *= -1;
      state.run.score += Math.round(100 * state.run.comboMultiplier);
      state.run.comboMultiplier = Math.min(3, state.run.comboMultiplier + 0.25);
      state.combat.impactRings.push({
        pos: { x: brick.x + brick.width / 2, y: brick.y + brick.height / 2 },
        color: brick.kind === "boss" ? "#ff74d1" : "#ffffff",
        radiusStart: 6,
        radiusEnd: 18,
        lifeMs: 140,
        maxLifeMs: 140,
      });
      if (brick.kind === "boss" && state.encounter.boss) {
        state.encounter.boss.hp = Math.max(0, state.encounter.boss.hp - 1);
        state.encounter.boss.phase =
          state.encounter.boss.hp <= state.encounter.boss.maxHp * 0.33
            ? 3
            : state.encounter.boss.hp <= state.encounter.boss.maxHp * 0.66
              ? 2
              : 1;
      }
      break;
    }
  }
  const objectiveBricks = state.combat.bricks.filter(
    (brick) => brick.alive && brick.kind !== "steel" && brick.kind !== "gate",
  );
  if (objectiveBricks.length === 0 || state.run.elapsedSec >= 10) {
    state.scene = "stageclear";
  }
}

function tickBossCycle(state: GameState): void {
  const boss = state.encounter.boss;
  state.combat.bossProjectiles = [];
  state.combat.enemies = [];
  if (!boss) {
    return;
  }
  const cycle = state.run.elapsedSec % 6;
  const lane: BossLane = cycle < 2 ? "left" : cycle < 4 ? "center" : "right";
  boss.lane = lane;
  boss.intent = cycle < 2 ? "volley" : cycle < 3.4 ? "sweep" : "burst";
  boss.telegraphProgress = cycle < 1.4 ? cycle / 1.4 : 0;
  boss.attackProgress = cycle >= 1.4 && cycle < 2.8 ? (cycle - 1.4) / 1.4 : 0;
  boss.punishProgress = cycle >= 2.8 ? (cycle - 2.8) / 3.2 : 0;
  boss.targetX = lane === "left" ? 180 : lane === "center" ? 480 : 780;
  boss.spread = boss.intent === "burst" ? 48 : 0;

  if (boss.attackProgress > 0) {
    state.combat.bossProjectiles.push({
      id: 1,
      x: boss.targetX ?? 480,
      y: 210 + boss.attackProgress * 120,
      radius: 10,
      source: "boss",
      style: boss.shotProfile,
    });
  }
}

function tickVisualWarnings(state: GameState): void {
  if (state.encounter.boss) {
    state.ui.warningLevel =
      state.encounter.boss.telegraphProgress > 0
        ? "critical"
        : state.encounter.boss.attackProgress > 0
          ? "elevated"
          : "calm";
    return;
  }
  if (state.encounter.modifierKey === "enemy_flux" || state.encounter.modifierKey === "flux") {
    state.ui.warningLevel = "elevated";
    return;
  }
  if (state.run.activeItems.some((item) => ITEM_REGISTRY[item.type].encounterBias === "boss")) {
    state.ui.warningLevel = "elevated";
    return;
  }
  state.ui.warningLevel = "calm";
}
