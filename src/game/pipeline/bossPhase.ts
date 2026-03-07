import type { SfxManager } from "../../audio/sfx";
import { BOSS_PHASE_CONFIG } from "../config";
import type { GameConfig, GameState, RandomSource } from "../types";

export function updateBossPhase(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  sfx: SfxManager,
  deltaSec: number,
): number {
  const boss = state.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    state.combat.bossPhase = 0;
    state.combat.bossPhaseSummonCooldownSec = 0;
    return 1;
  }
  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 12);
  const phase = hp <= maxHp * BOSS_PHASE_CONFIG.phase2Ratio ? 2 : 1;
  if (state.combat.bossPhase !== phase) {
    state.combat.bossPhase = phase;
    if (phase === 2) {
      state.combat.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
      state.vfx.flashMs = Math.max(state.vfx.flashMs, 120);
      state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 90);
      state.vfx.shakePx = Math.max(state.vfx.shakePx, 4);
      state.vfx.floatingTexts.push({
        key: "boss_phase_2",
        pos: { x: boss.x + boss.width / 2, y: boss.y + boss.height / 2 },
        lifeMs: 600,
        maxLifeMs: 600,
        color: "rgba(255, 196, 112, 0.95)",
      });
      void sfx.play("combo_fill");
    }
  }
  if (phase >= 2) {
    state.combat.bossPhaseSummonCooldownSec = Math.max(0, state.combat.bossPhaseSummonCooldownSec - deltaSec);
    if (state.combat.bossPhaseSummonCooldownSec <= 0) {
      spawnBossAdd(state, config, random);
      state.combat.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
    }
    return BOSS_PHASE_CONFIG.phase2SpeedScale;
  }
  return 1;
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
