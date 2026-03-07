import type { SfxManager } from "../../audio/sfx";
import { createEncounterState } from "../bossState";
import { BOSS_PHASE_CONFIG, ENCOUNTER_CONFIG } from "../config";
import { consumeShield } from "../itemSystem";
import { resolveStageMetadataFromState } from "../stageContext";
import type { BossLane, GameConfig, GameState, RandomSource } from "../types";

export function updateBossPhase(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  sfx: SfxManager,
  deltaSec: number,
): number {
  const metadata = resolveStageMetadataFromState(state);
  const encounter = state.combat.encounterState;
  syncOverdrive(state, deltaSec);
  decayRiskChain(state, deltaSec);
  const boss = state.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    state.combat.bossPhase = 0;
    state.combat.bossPhaseSummonCooldownSec = 0;
    state.combat.bossAttackState = encounter;
    if (encounter.projectiles.length <= 0) {
      state.combat.encounterState = createEncounterState();
      state.combat.bossAttackState = state.combat.encounterState;
    } else {
      updateBossProjectiles(state, config, deltaSec);
    }
    state.combat.forcedBallLoss = false;
    return 1;
  }

  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 18);
  const phase = resolveBossPhase(hp, maxHp);
  const profile =
    metadata.stage.encounter?.profile ?? (state.campaign.stageIndex >= 11 ? "final_core" : "warden");
  encounter.kind = metadata.stage.encounter?.kind ?? "boss";
  encounter.profile = profile;
  encounter.phase = phase;
  state.combat.bossAttackState = encounter;
  if (state.combat.bossPhase !== phase) {
    state.combat.bossPhase = phase;
    if (phase >= 2) {
      applyPhaseTransitionFeedback(state, boss, phase as 2 | 3, sfx);
    }
    encounter.actionCooldownSec = BOSS_PHASE_CONFIG.actionCooldownSecByPhase[phase - 1];
  }

  updateBossProjectiles(state, config, deltaSec);
  updateBossSweep(state, config, deltaSec);
  encounter.vulnerabilitySec = Math.max(0, encounter.vulnerabilitySec - deltaSec);

  if (phase <= 2 && profile !== "artillery") {
    state.combat.bossPhaseSummonCooldownSec = Math.max(0, state.combat.bossPhaseSummonCooldownSec - deltaSec);
    encounter.summonCooldownSec = state.combat.bossPhaseSummonCooldownSec;
    if (state.combat.bossPhaseSummonCooldownSec <= 0) {
      spawnBossAdd(state, config, random);
      state.combat.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
    }
  } else {
    state.combat.bossPhaseSummonCooldownSec = 0;
    encounter.summonCooldownSec = 0;
  }

  updateTelegraph(state, boss, config, random, deltaSec, profile);

  return BOSS_PHASE_CONFIG.speedScaleByPhase[phase - 1];
}

function resolveBossPhase(hp: number, maxHp: number): 1 | 2 | 3 {
  if (hp <= maxHp * BOSS_PHASE_CONFIG.phase3Ratio) {
    return 3;
  }
  if (hp <= maxHp * BOSS_PHASE_CONFIG.phase2Ratio) {
    return 2;
  }
  return 1;
}

function applyPhaseTransitionFeedback(
  state: GameState,
  boss: GameState["bricks"][number],
  phase: 2 | 3,
  sfx: SfxManager,
): void {
  state.vfx.flashMs = Math.max(state.vfx.flashMs, BOSS_PHASE_CONFIG.phaseChangeFlashMs);
  state.vfx.flashColor = phase === 3 ? "rgba(255, 92, 138, 0.92)" : "rgba(255, 196, 112, 0.95)";
  state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 96);
  state.vfx.shakePx = Math.max(state.vfx.shakePx, 4.5);
  state.vfx.floatingTexts.push({
    key: phase === 3 ? "boss_phase_3" : "boss_phase_2",
    pos: { x: boss.x + boss.width / 2, y: boss.y + boss.height / 2 },
    lifeMs: 640,
    maxLifeMs: 640,
    color: phase === 3 ? "rgba(255, 128, 168, 0.96)" : "rgba(255, 196, 112, 0.95)",
  });
  void sfx.play("combo_fill");
}

function updateTelegraph(
  state: GameState,
  boss: GameState["bricks"][number],
  config: GameConfig,
  random: RandomSource,
  deltaSec: number,
  profile: NonNullable<GameState["combat"]["encounterState"]["profile"]>,
): void {
  const attack = state.combat.encounterState;
  if (attack.telegraph) {
    attack.telegraph.remainingSec = Math.max(0, attack.telegraph.remainingSec - deltaSec);
    if (attack.telegraph.remainingSec <= 0) {
      resolveTelegraphedAttack(state, boss, config, attack.telegraph);
      attack.telegraph = null;
      attack.actionCooldownSec = BOSS_PHASE_CONFIG.actionCooldownSecByPhase[state.combat.bossPhase - 1];
      attack.vulnerabilityMaxSec = profile === "ex_overlord" ? 1.1 : 1.8;
      attack.vulnerabilitySec = attack.vulnerabilityMaxSec;
    }
    return;
  }
  if (attack.sweep || state.combat.bossPhase <= 1) {
    return;
  }
  attack.actionCooldownSec = Math.max(0, attack.actionCooldownSec - deltaSec);
  if (attack.actionCooldownSec > 0) {
    return;
  }

  if (profile === "warden") {
    attack.telegraph = {
      kind: "gate_sweep",
      remainingSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[Math.max(0, state.combat.bossPhase - 1)],
      maxSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[Math.max(0, state.combat.bossPhase - 1)],
      lane: pickLane(state.paddle.x + state.paddle.width / 2, config.width),
    };
  } else if (profile === "artillery") {
    attack.telegraph = {
      kind: "burst",
      remainingSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[Math.max(0, state.combat.bossPhase - 1)],
      maxSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[Math.max(0, state.combat.bossPhase - 1)],
      targetX: state.paddle.x + state.paddle.width / 2,
      spread: BOSS_PHASE_CONFIG.volleySpreadX * 1.2,
    };
  } else if (state.combat.bossPhase === 2) {
    attack.telegraph = {
      kind: "volley",
      remainingSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[1],
      maxSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[1],
      targetX: state.paddle.x + state.paddle.width / 2,
      spread: random.next() > 0.5 ? BOSS_PHASE_CONFIG.volleySpreadX : 0,
    };
  } else {
    attack.telegraph =
      random.next() > 0.45
        ? {
            kind: "sweep",
            remainingSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[2],
            maxSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[2],
            lane: pickLane(state.paddle.x + state.paddle.width / 2, config.width),
          }
        : {
            kind: "volley",
            remainingSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[2],
            maxSec: BOSS_PHASE_CONFIG.telegraphSecByPhase[2],
            targetX: state.paddle.x + state.paddle.width / 2,
            spread: BOSS_PHASE_CONFIG.volleySpreadX,
          };
  }

  state.vfx.floatingTexts.push({
    key: "boss_warning",
    pos: { x: boss.x + boss.width / 2, y: boss.y + boss.height + 18 },
    lifeMs: 420,
    maxLifeMs: 420,
    color: "rgba(255, 226, 166, 0.96)",
  });
}

function resolveTelegraphedAttack(
  state: GameState,
  boss: GameState["bricks"][number],
  config: GameConfig,
  telegraph: NonNullable<GameState["combat"]["bossAttackState"]["telegraph"]>,
): void {
  if (telegraph.kind === "volley" || telegraph.kind === "burst") {
    spawnBossVolley(state, boss, config, telegraph.targetX ?? config.width / 2, telegraph.spread ?? 0);
    return;
  }
  if ((telegraph.kind === "sweep" || telegraph.kind === "gate_sweep") && telegraph.lane) {
    state.combat.bossAttackState.sweep = {
      lane: telegraph.lane,
      remainingSec: BOSS_PHASE_CONFIG.sweepDurationSec,
      maxSec: BOSS_PHASE_CONFIG.sweepDurationSec,
    };
    state.vfx.flashMs = Math.max(state.vfx.flashMs, 80);
    state.vfx.flashColor = "rgba(255, 116, 116, 0.84)";
  }
}

function spawnBossVolley(
  state: GameState,
  boss: GameState["bricks"][number],
  config: GameConfig,
  targetX: number,
  spread: number,
): void {
  const attack = state.combat.bossAttackState;
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

function updateBossProjectiles(state: GameState, config: GameConfig, deltaSec: number): void {
  const next = [];
  for (const shot of state.combat.bossAttackState.projectiles) {
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
  state.combat.bossAttackState.projectiles = next;
}

function updateBossSweep(state: GameState, config: GameConfig, deltaSec: number): void {
  const sweep = state.combat.bossAttackState.sweep;
  if (!sweep) {
    return;
  }
  sweep.remainingSec = Math.max(0, sweep.remainingSec - deltaSec);
  if (intersectsLane(state, config.width, sweep.lane)) {
    applyBossHit(state);
    state.combat.bossAttackState.sweep = null;
    return;
  }
  if (sweep.remainingSec <= 0) {
    state.combat.bossAttackState.sweep = null;
  }
}

function applyBossHit(state: GameState): void {
  if (state.items.active.decoyStacks > 0) {
    state.items.active.decoyStacks = 0;
    state.vfx.flashMs = Math.max(state.vfx.flashMs, 64);
    state.vfx.flashColor = "rgba(255, 216, 144, 0.86)";
    return;
  }
  if (consumeShield(state.items)) {
    state.combat.shieldBurstQueued = true;
    state.vfx.flashMs = Math.max(state.vfx.flashMs, 72);
    state.vfx.flashColor = "rgba(120, 255, 230, 0.82)";
    return;
  }
  state.combat.forcedBallLoss = true;
  state.vfx.flashMs = Math.max(state.vfx.flashMs, 120);
  state.vfx.flashColor = "rgba(255, 108, 108, 0.92)";
  state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 90);
  state.vfx.shakePx = Math.max(state.vfx.shakePx, 4);
}

function decayRiskChain(state: GameState, deltaSec: number): void {
  state.combat.riskChain.value = Math.max(
    0,
    state.combat.riskChain.value - state.combat.riskChain.decayPerSec * deltaSec,
  );
}

function syncOverdrive(state: GameState, deltaSec: number): void {
  if (!state.combat.overdrive.active) {
    return;
  }
  state.combat.overdrive.remainingSec = Math.max(0, state.combat.overdrive.remainingSec - deltaSec);
  if (state.combat.overdrive.remainingSec <= 0) {
    state.combat.overdrive.active = false;
  }
}

export function awardRiskChain(state: GameState, amount: number, position: { x: number; y: number }): void {
  state.combat.riskChain.value = Math.min(state.combat.riskChain.max, state.combat.riskChain.value + amount);
  state.stageStats.peakRiskChain = Math.max(
    state.stageStats.peakRiskChain ?? 0,
    state.combat.riskChain.value,
  );
  if (state.combat.riskChain.value < state.combat.riskChain.threshold || state.combat.overdrive.active) {
    return;
  }
  state.combat.riskChain.value = 0;
  state.combat.overdrive.active = true;
  state.combat.overdrive.remainingSec = ENCOUNTER_CONFIG.overdriveDurationSec;
  state.combat.overdrive.maxSec = ENCOUNTER_CONFIG.overdriveDurationSec;
  state.vfx.flashMs = Math.max(state.vfx.flashMs, 120);
  state.vfx.flashColor = "rgba(255, 166, 84, 0.94)";
  state.vfx.floatingTexts.push({
    key: "overdrive",
    pos: position,
    lifeMs: 540,
    maxLifeMs: 540,
    color: "rgba(255, 214, 122, 0.96)",
  });
}

function spawnBossAdd(state: GameState, config: GameConfig, random: RandomSource): void {
  if (state.enemies.length >= 2) {
    return;
  }
  const nextId = state.enemies.reduce((max, enemy) => Math.max(max, enemy.id), 0) + 1;
  const x = 120 + random.next() * (config.width - 240);
  state.enemies.push({
    id: nextId,
    x,
    y: 138,
    vx: random.next() > 0.5 ? 110 : -110,
    radius: 11,
    alive: true,
  });
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
    x + radius < state.paddle.x ||
    x - radius > state.paddle.x + state.paddle.width ||
    y + radius < state.paddle.y ||
    y - radius > state.paddle.y + state.paddle.height
  );
}

function intersectsLane(state: GameState, width: number, lane: BossLane): boolean {
  const center = state.paddle.x + state.paddle.width / 2;
  if (lane === "left") {
    return center <= width / 3;
  }
  if (lane === "right") {
    return center >= (width / 3) * 2;
  }
  return center > width / 3 && center < (width / 3) * 2;
}
