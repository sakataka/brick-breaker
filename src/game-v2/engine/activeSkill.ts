import type { GameState } from "../public/types";

export function castActiveSkill(state: GameState): boolean {
  if (state.combat.activeSkill.remainingCooldownSec > 0) {
    return false;
  }

  const brick = state.combat.bricks.find(
    (candidate) => candidate.alive && candidate.kind !== "steel" && candidate.kind !== "gate",
  );
  if (!brick) {
    return false;
  }

  brick.alive = false;
  brick.hp = 0;
  if (brick.kind === "boss" && state.encounter.boss) {
    state.encounter.boss.hp = Math.max(0, state.encounter.boss.hp - 1);
  }
  state.run.score += 250;
  state.combat.activeSkill.remainingCooldownSec = state.combat.activeSkill.cooldownSec;
  return true;
}
