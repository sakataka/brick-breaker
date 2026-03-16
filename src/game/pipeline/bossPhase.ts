import type { SfxManager } from "../../audio/sfx";
import { createEncounterState } from "../bossState";
import { getBossDefinition } from "../config/bosses";
import { BOSS_PHASE_CONFIG } from "../config";
import { pushEncounterCue } from "../encounterSystem";
import { consumeShield } from "../itemSystem";
import { resolveStageMetadataFromState } from "../stageContext";
import type { BossLane, GameConfig, GameState, RandomSource, ThreatLevel } from "../types";

export function updateBossPhase(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  sfx: SfxManager,
  deltaSec: number,
): number {
  const metadata = resolveStageMetadataFromState(state);
  const encounter = state.encounter.runtime;
  const boss = state.combat.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    state.encounter.bossPhase = 0;
    state.encounter.bossPhaseSummonCooldownSec = 0;
    if (encounter.projectiles.length <= 0) {
      state.encounter.runtime = createEncounterState();
    } else {
      updateBossProjectiles(state, config, deltaSec);
    }
    state.encounter.forcedBallLoss = false;
    return 1;
  }

  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 18);
  const phase = resolveBossPhase(hp, maxHp);
  const profile =
    metadata.stage.encounter?.profile ??
    (state.run.progress.encounterIndex >= 11 ? "final_core" : "warden");
  const bossDefinition = metadata.stage.encounter?.bossDefinition ?? getBossDefinition(profile);
  encounter.kind = metadata.stage.encounter?.kind ?? "boss";
  encounter.profile = profile;
  encounter.phase = phase;
  encounter.stageThreatLevel = resolvePhaseThreat(phase, bossDefinition);
  state.encounter.threatLevel = encounter.stageThreatLevel;
  if (state.encounter.bossPhase !== phase) {
    state.encounter.bossPhase = phase;
    encounter.lastTriggeredPhase = phase;
    if (phase >= 2) {
      applyPhaseTransitionFeedback(state, boss, phase as 2 | 3, sfx);
    }
    encounter.actionCooldownSec = BOSS_PHASE_CONFIG.actionCooldownSecByPhase[phase - 1];
    pushEncounterCue(
      state,
      "boss_phase_shift",
      phase === 3 ? "critical" : "high",
      phase === 3 ? 1.45 : 1.2,
    );
  }

  updateBossProjectiles(state, config, deltaSec);
  updateBossSweep(state, config, deltaSec);
  encounter.vulnerabilitySec = Math.max(0, encounter.vulnerabilitySec - deltaSec);

  if (phase <= 2 && profile !== "artillery") {
    state.encounter.bossPhaseSummonCooldownSec = Math.max(
      0,
      state.encounter.bossPhaseSummonCooldownSec - deltaSec,
    );
    encounter.summonCooldownSec = state.encounter.bossPhaseSummonCooldownSec;
    if (state.encounter.bossPhaseSummonCooldownSec <= 0) {
      spawnBossAdd(state, config, random);
      state.encounter.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
    }
  } else {
    state.encounter.bossPhaseSummonCooldownSec = 0;
    encounter.summonCooldownSec = 0;
  }

  updateTelegraph(state, boss, config, random, deltaSec, profile, bossDefinition);

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
  boss: GameState["combat"]["bricks"][number],
  phase: 2 | 3,
  sfx: SfxManager,
): void {
  state.ui.vfx.flashMs = Math.max(state.ui.vfx.flashMs, BOSS_PHASE_CONFIG.phaseChangeFlashMs);
  state.ui.vfx.flashColor = phase === 3 ? "rgba(255, 92, 138, 0.92)" : "rgba(255, 196, 112, 0.95)";
  state.ui.vfx.shakeMs = Math.max(state.ui.vfx.shakeMs, 96);
  state.ui.vfx.shakePx = Math.max(state.ui.vfx.shakePx, 4.5);
  state.ui.vfx.floatingTexts.push({
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
  boss: GameState["combat"]["bricks"][number],
  config: GameConfig,
  random: RandomSource,
  deltaSec: number,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
  bossDefinition: ReturnType<typeof getBossDefinition>,
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

function updateBossProjectiles(state: GameState, config: GameConfig, deltaSec: number): void {
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

function updateBossSweep(state: GameState, config: GameConfig, deltaSec: number): void {
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

function spawnBossAdd(state: GameState, config: GameConfig, random: RandomSource): void {
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

function resolvePhaseThreat(
  phase: 1 | 2 | 3,
  bossDefinition: ReturnType<typeof getBossDefinition>,
): ThreatLevel {
  return bossDefinition?.phaseRules.find((rule) => rule.phase === phase)?.threatLevel ?? "high";
}

function resolvePunishWindowSec(
  phase: 1 | 2 | 3,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
  bossDefinition: ReturnType<typeof getBossDefinition>,
): number {
  const configured = bossDefinition?.phaseRules.find(
    (rule) => rule.phase === phase,
  )?.punishWindowSec;
  if (configured) {
    return configured;
  }
  return profile === "ex_overlord" ? 1.1 : 1.8;
}

function selectBossAttack(
  state: GameState,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
  random: RandomSource,
  bossDefinition: ReturnType<typeof getBossDefinition>,
): NonNullable<GameState["encounter"]["runtime"]["telegraph"]>["kind"] {
  const pattern = bossDefinition?.attackPatterns.find(
    (entry) => entry.phase === state.encounter.bossPhase,
  );
  const attacks = pattern?.attacks;
  if (attacks && attacks.length > 0) {
    const index = Math.floor(random.next() * attacks.length);
    return attacks[index] ?? attacks[attacks.length - 1];
  }
  if (profile === "warden") {
    return "gate_sweep";
  }
  if (profile === "artillery") {
    return "burst";
  }
  return state.encounter.bossPhase >= 3 && random.next() > 0.45 ? "sweep" : "volley";
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
