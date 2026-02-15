import type { Brick } from "./types";

export type BrickDamageSource = "direct" | "explosion";

export interface BrickDamageResult {
  destroyed: boolean;
  hpChanged: boolean;
}

export function getDefaultBrickHp(brick: Brick): number {
  const kind = brick.kind ?? "normal";
  if (kind === "boss") {
    return 12;
  }
  if (kind === "normal" || kind === "hazard") {
    return 1;
  }
  return 2;
}

export function applyBrickDamage(brick: Brick, source: BrickDamageSource): BrickDamageResult {
  if (!brick.alive) {
    return { destroyed: false, hpChanged: false };
  }

  const kind = brick.kind ?? "normal";
  const currentHp = resolveCurrentBrickHp(brick);
  const nextHp = Math.max(0, currentHp - 1);

  if (source === "explosion" && kind === "armored") {
    const armoredHp = Math.max(1, nextHp);
    const hpChanged = brick.hp !== armoredHp;
    brick.hp = armoredHp;
    return {
      destroyed: false,
      hpChanged,
    };
  }

  if (source === "direct" && kind === "regen" && nextHp === 1) {
    const regenCharges = Math.max(0, brick.regenCharges ?? 1);
    if (regenCharges > 0) {
      brick.regenCharges = regenCharges - 1;
      const regenHp = 2;
      const hpChanged = brick.hp !== regenHp;
      brick.hp = regenHp;
      return {
        destroyed: false,
        hpChanged,
      };
    }
  }

  brick.hp = nextHp;
  if (nextHp > 0) {
    return {
      destroyed: false,
      hpChanged: nextHp !== currentHp,
    };
  }

  brick.alive = false;
  return {
    destroyed: true,
    hpChanged: true,
  };
}

export function applyDirectBrickDamage(brick: Brick): boolean {
  return applyBrickDamage(brick, "direct").destroyed;
}

export function destroyBrickImmediately(brick: Brick): boolean {
  if (!brick.alive) {
    return false;
  }
  brick.hp = 0;
  brick.alive = false;
  return true;
}

function resolveCurrentBrickHp(brick: Brick): number {
  if (typeof brick.hp === "number" && Number.isFinite(brick.hp)) {
    return brick.hp;
  }
  return getDefaultBrickHp(brick);
}
