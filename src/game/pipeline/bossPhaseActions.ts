import { BOSS_PHASE_CONFIG } from "../config";
import { pushEncounterCue } from "../encounterSystem";
import { consumeShield } from "../itemSystem";
import type { BossLane, GameConfig, GameState, RandomSource, ThreatLevel } from "../types";
import { resolvePunishWindowSec, selectBossAttack } from "./bossPhaseHelpers";

export function updateBossTelegraph(
  state: GameState,
  boss: GameState["combat"]["bricks"][number],
  config: GameConfig,
  random: RandomSource,
  deltaSec: number,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
  bossDefinition: Parameters<typeof selectBossAttack>[3],
): void {
  const attack = state.encounter.runtime;
  if (attack.telegraph) {
    attack.telegraph.remainingSec = Math.max(0, attack.telegraph.remainingSec - deltaSec);
    if (attack.telegraph.remainingSec <= 0) {
      resolveTelegraphedAttack(state, boss, config, attack.telegraph);
      attack.telegraph = null;
      const resolvedPhase = Math.max(1, state.encounter.bossPhase) as 1 | 2 | 3;
      attack.actionCooldownSec = BOSS_PHASE_CONFIG.actionCooldownSecByPhase[resolvedPhase - 1];
      attack.vulnerabilityMaxSec = resolvePunishWindowSec(resolvedPhase, profile, bossDefinition);
      attack.vulnerabilitySec = attack.vulnerabilityMaxSec;
      pushEncounterCue(
        state,
        "punish_window",
        state.encounter.bossPhase >= 3 ? "critical" : "high",
        Math.max(0.8, attack.vulnerabilityMaxSec),
      );
    }
    return;
  }
  if (attack.sweep || state.encounter.bossPhase <= 1) {
    return;
  }
  attack.actionCooldownSec = Math.max(0, attack.actionCooldownSec - deltaSec);
  if (attack.actionCooldownSec > 0) {
    return;
  }

  const attackKind = selectBossAttack(state, profile, random, bossDefinition);
  const telegraphSec =
    BOSS_PHASE_CONFIG.telegraphSecByPhase[Math.max(0, state.encounter.bossPhase - 1)];
  attack.telegraph = buildTelegraph(state, config, attackKind, telegraphSec, profile);
  state.encounter.activeTelegraphs = attack.telegraph ? [attack.telegraph] : [];
  pushEncounterCue(
    state,
    attackKind === "burst" || attackKind === "sweep" || attackKind === "gate_sweep"
      ? "warning_lane"
      : "hazard_surge",
    state.encounter.bossPhase >= 3 ? "critical" : "high",
    telegraphSec,
  );

  state.ui.vfx.floatingTexts.push({
    key: "boss_warning",
    pos: { x: boss.x + boss.width / 2, y: boss.y + boss.height + 18 },
    lifeMs: 420,
    maxLifeMs: 420,
    color: "rgba(255, 226, 166, 0.96)",
  });
}

export function updateBossProjectiles(
  state: GameState,
  config: GameConfig,
  deltaSec: number,
): void {
  const next = [];
  for (const shot of state.encounter.runtime.projectiles) {
    const moved = {
      ...shot,
      x: shot.x + shot.vx * deltaSec,
      y: shot.y + shot.vy * deltaSec,
    };
    if (moved.y - moved.radius > config.height || moved.x < -40 || moved.x > config.width + 40) {
      continue;
    }
    if (intersectsPaddle(state, moved.x, moved.y, moved.radius)) {
      applyBossHit(state);
      continue;
    }
    next.push(moved);
  }
  state.encounter.runtime.projectiles = next;
}

export function updateBossSweep(state: GameState, config: GameConfig, deltaSec: number): void {
  const sweep = state.encounter.runtime.sweep;
  if (!sweep) {
    return;
  }
  sweep.remainingSec = Math.max(0, sweep.remainingSec - deltaSec);
  if (intersectsLane(state, config.width, sweep.lane)) {
    applyBossHit(state);
    state.encounter.runtime.sweep = null;
    return;
  }
  if (sweep.remainingSec <= 0) {
    state.encounter.runtime.sweep = null;
  }
}

export function spawnBossAdd(state: GameState, config: GameConfig, random: RandomSource): void {
  if (state.combat.enemies.length >= 2) {
    return;
  }
  const nextId = state.combat.enemies.reduce((max, enemy) => Math.max(max, enemy.id), 0) + 1;
  const x = 120 + random.next() * (config.width - 240);
  state.combat.enemies.push({
    id: nextId,
    x,
    y: 138,
    vx: random.next() > 0.5 ? 110 : -110,
    radius: 11,
    alive: true,
  });
  pushEncounterCue(state, "hazard_surge", "high", 1.1);
}

function resolveTelegraphedAttack(
  state: GameState,
  boss: GameState["combat"]["bricks"][number],
  config: GameConfig,
  telegraph: NonNullable<GameState["encounter"]["runtime"]["telegraph"]>,
): void {
  if (telegraph.kind === "summon") {
    spawnBossAdd(state, config, { next: () => 0.5 });
    return;
  }
  if (telegraph.kind === "volley" || telegraph.kind === "burst") {
    spawnBossVolley(
      state,
      boss,
      config,
      telegraph.targetX ?? config.width / 2,
      telegraph.spread ?? 0,
    );
    return;
  }
  if ((telegraph.kind === "sweep" || telegraph.kind === "gate_sweep") && telegraph.lane) {
    state.encounter.runtime.sweep = {
      lane: telegraph.lane,
      remainingSec: BOSS_PHASE_CONFIG.sweepDurationSec,
      maxSec: BOSS_PHASE_CONFIG.sweepDurationSec,
    };
    state.ui.vfx.flashMs = Math.max(state.ui.vfx.flashMs, 80);
    state.ui.vfx.flashColor = "rgba(255, 116, 116, 0.84)";
  }
}

function spawnBossVolley(
  state: GameState,
  boss: GameState["combat"]["bricks"][number],
  config: GameConfig,
  targetX: number,
  spread: number,
): void {
  const attack = state.encounter.runtime;
  const centerX = boss.x + boss.width / 2;
  const originY = boss.y + boss.height + 12;
  const targetXs = spread > 0 ? [targetX - spread, targetX, targetX + spread] : [targetX];
  for (const x of targetXs) {
    const dx = x - centerX;
    const dy = config.height - 120 - originY;
    const length = Math.max(1, Math.hypot(dx, dy));
    attack.projectiles.push({
      id: attack.nextProjectileId,
      x: centerX,
      y: originY,
      vx: (dx / length) * BOSS_PHASE_CONFIG.projectileSpeed,
      vy: (dy / length) * BOSS_PHASE_CONFIG.projectileSpeed,
      radius: BOSS_PHASE_CONFIG.projectileRadius,
    });
    attack.nextProjectileId += 1;
  }
}

function buildTelegraph(
  state: GameState,
  config: GameConfig,
  kind: NonNullable<GameState["encounter"]["runtime"]["telegraph"]>["kind"],
  telegraphSec: number,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
): NonNullable<GameState["encounter"]["runtime"]["telegraph"]> {
  const severity: ThreatLevel = state.encounter.bossPhase >= 3 ? "critical" : "high";
  if (kind === "gate_sweep" || kind === "sweep") {
    return {
      kind,
      remainingSec: telegraphSec,
      maxSec: telegraphSec,
      lane: pickLane(state.combat.paddle.x + state.combat.paddle.width / 2, config.width),
      severity,
    };
  }
  if (kind === "burst") {
    return {
      kind,
      remainingSec: telegraphSec,
      maxSec: telegraphSec,
      targetX: state.combat.paddle.x + state.combat.paddle.width / 2,
      spread: BOSS_PHASE_CONFIG.volleySpreadX * (profile === "artillery" ? 1.2 : 1),
      severity,
    };
  }
  if (kind === "summon") {
    return {
      kind,
      remainingSec: telegraphSec,
      maxSec: telegraphSec,
      severity,
    };
  }
  return {
    kind,
    remainingSec: telegraphSec,
    maxSec: telegraphSec,
    targetX: state.combat.paddle.x + state.combat.paddle.width / 2,
    spread:
      state.encounter.bossPhase >= 2 && kind === "volley" ? BOSS_PHASE_CONFIG.volleySpreadX : 0,
    severity,
  };
}

function applyBossHit(state: GameState): void {
  if (consumeShield(state.combat.items)) {
    state.combat.shieldBurstQueued = true;
    state.ui.vfx.flashMs = Math.max(state.ui.vfx.flashMs, 72);
    state.ui.vfx.flashColor = "rgba(120, 255, 230, 0.82)";
    return;
  }
  state.encounter.forcedBallLoss = true;
  state.ui.vfx.flashMs = Math.max(state.ui.vfx.flashMs, 120);
  state.ui.vfx.flashColor = "rgba(255, 108, 108, 0.92)";
  state.ui.vfx.shakeMs = Math.max(state.ui.vfx.shakeMs, 90);
  state.ui.vfx.shakePx = Math.max(state.ui.vfx.shakePx, 4);
}

function pickLane(paddleCenterX: number, width: number): BossLane {
  const ratio = paddleCenterX / Math.max(1, width);
  if (ratio < 0.33) {
    return "left";
  }
  if (ratio > 0.66) {
    return "right";
  }
  return "center";
}

function intersectsPaddle(state: GameState, x: number, y: number, radius: number): boolean {
  return !(
    x + radius < state.combat.paddle.x ||
    x - radius > state.combat.paddle.x + state.combat.paddle.width ||
    y + radius < state.combat.paddle.y ||
    y - radius > state.combat.paddle.y + state.combat.paddle.height
  );
}

function intersectsLane(state: GameState, width: number, lane: BossLane): boolean {
  const center = state.combat.paddle.x + state.combat.paddle.width / 2;
  if (lane === "left") {
    return center <= width / 3;
  }
  if (lane === "right") {
    return center >= (width / 3) * 2;
  }
  return center > width / 3 && center < (width / 3) * 2;
}
