import type { SfxManager } from "../audio/sfx";
import type { PhysicsResult } from "./physics";
import type { CollisionEvent, GameState } from "./types";

export type PhysicsOutcome = "continue" | "lifeLost" | "cleared";

export function playCollisionSounds(sfx: SfxManager, events: CollisionEvent[]): void {
  const kinds = new Set(events.map((event) => event.kind));
  if (kinds.has("wall")) void sfx.play("wall");
  if (kinds.has("paddle")) void sfx.play("paddle");
  if (kinds.has("brick")) void sfx.play("brick");
  if (kinds.has("miss")) void sfx.play("miss");
}

export function applyPhysicsResultScore(
  state: GameState,
  result: PhysicsResult,
  clearBonusPerLife: number,
): PhysicsOutcome {
  if (result.collision.brick > 0) {
    state.score += result.scoreGain;
  }
  if (result.livesLost > 0) {
    return "lifeLost";
  }
  if (result.cleared) {
    state.score += state.lives * clearBonusPerLife;
    return "cleared";
  }
  return "continue";
}
