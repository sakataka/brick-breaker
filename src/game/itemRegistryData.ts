import { applyDirectBrickDamage } from "./brickDamage";
import { ITEM_BALANCE, ITEM_CONFIG } from "./config/items";
import type {
  ItemEffectContext,
  ItemPickupImpact,
  ItemPickupPresentation,
  ItemRegistry,
} from "./itemTypes";
import type { Ball, Brick, ItemType } from "./types";

const ITEM_TYPE_ORDER = [
  "paddle_plus",
  "slow_ball",
  "shield",
  "multiball",
  "pierce",
  "bomb",
  "shockwave",
  "pulse",
  "laser",
  "homing",
  "rail",
] as const;

export const ITEM_ORDER: ItemType[] = [...ITEM_TYPE_ORDER];

const BASE_PRESENTATION: ItemPickupPresentation = {
  flashMs: 84,
  hitFreezeMs: 22,
  shakeMs: 52,
  shakePx: 1.8,
  auraMs: 520,
  toastMs: 880,
};

function createPresentation(overrides: Partial<ItemPickupPresentation>): ItemPickupPresentation {
  return {
    ...BASE_PRESENTATION,
    ...overrides,
  };
}

function noImpact(
  effect: (context: ItemEffectContext) => void,
): (context: ItemEffectContext) => undefined {
  return (context) => {
    effect(context);
    return undefined;
  };
}

function accelerateBall(ball: Ball, factor: number): void {
  const speed = Math.hypot(ball.vel.x, ball.vel.y) || ball.speed || 1;
  const nextSpeed = speed * factor;
  const vx = ball.vel.x / speed;
  const vy = ball.vel.y / speed;
  ball.vel.x = vx * nextSpeed;
  ball.vel.y = vy * nextSpeed;
  ball.speed = nextSpeed;
  ball.pos.x += vx * 6;
  ball.pos.y += vy * 6;
}

function buildShockwaveImpact(
  balls: Ball[],
  bricks: Brick[],
  scorePerBrick: number,
): ItemPickupImpact | undefined {
  if (balls.length <= 0 || bricks.length <= 0) {
    return undefined;
  }
  const destroyed = selectShockwaveTargets(balls, bricks);
  if (destroyed.length <= 0) {
    for (const ball of balls) {
      accelerateBall(ball, 1.05);
    }
    return undefined;
  }

  const events = [];
  for (const ball of balls) {
    accelerateBall(ball, 1.08);
  }
  for (const brick of destroyed) {
    if (!applyDirectBrickDamage(brick)) {
      continue;
    }
    events.push({
      kind: "brick" as const,
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      color: brick.color,
      brickKind: brick.kind ?? "normal",
      brickId: brick.id,
    });
  }
  if (events.length <= 0) {
    return undefined;
  }
  return {
    scoreGain: scorePerBrick * events.length,
    collisionEvents: events,
  };
}

function selectShockwaveTargets(balls: Ball[], bricks: Brick[]): Brick[] {
  const targets = new Map<number, { brick: Brick; distanceSq: number }>();
  for (const ball of balls) {
    for (const brick of bricks) {
      if (!brick.alive || (brick.kind ?? "normal") !== "normal") {
        continue;
      }
      const cx = brick.x + brick.width / 2;
      const cy = brick.y + brick.height / 2;
      const dx = cx - ball.pos.x;
      const dy = cy - ball.pos.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > 92 * 92) {
        continue;
      }
      const existing = targets.get(brick.id);
      if (!existing || distanceSq < existing.distanceSq) {
        targets.set(brick.id, { brick, distanceSq });
      }
    }
  }
  return [...targets.values()]
    .sort((a, b) => a.distanceSq - b.distanceSq)
    .slice(0, 3)
    .map((entry) => entry.brick);
}

export const ITEM_REGISTRY: ItemRegistry = {
  paddle_plus: {
    type: "paddle_plus",
    stackKey: "paddlePlusStacks",
    icon: "🟦",
    color: "rgba(104, 216, 255, 0.8)",
    weight: ITEM_CONFIG.paddle_plus.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 1,
    startSettingsVisibleOrder: 1,
    roleTag: "control",
    sfxEvent: "item_paddle_plus",
    synergyTags: ["control", "survival"],
    counterplayTags: ["survival_check", "hazard_flux"],
    previewAffinity: ["survival_check", "hazard_flux"],
    presentation: createPresentation({ flashMs: 76, auraMs: 620 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.paddlePlusStacks += 1;
    }),
    getLabelStack: (stacks) => stacks.paddlePlusStacks,
  },
  slow_ball: {
    type: "slow_ball",
    stackKey: "slowBallStacks",
    icon: "🐢",
    color: "rgba(255, 191, 112, 0.85)",
    weight: ITEM_CONFIG.slow_ball.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 2,
    startSettingsVisibleOrder: 2,
    roleTag: "control",
    sfxEvent: "item_slow_ball",
    synergyTags: ["control", "survival"],
    counterplayTags: ["sweep_alert", "hazard_flux", "turret_lane"],
    previewAffinity: ["hazard_flux", "sweep_alert"],
    presentation: createPresentation({ flashMs: 92, hitFreezeMs: 18 }),
    applyPickup: noImpact(({ stacks, balls }) => {
      stacks.slowBallStacks += 1;
      for (const ball of balls) {
        ball.vel.x *= ITEM_BALANCE.slowBallInstantSpeedScale;
        ball.vel.y *= ITEM_BALANCE.slowBallInstantSpeedScale;
        ball.speed *= ITEM_BALANCE.slowBallInstantSpeedScale;
      }
    }),
    getLabelStack: (stacks) => stacks.slowBallStacks,
  },
  shield: {
    type: "shield",
    stackKey: "shieldCharges",
    icon: "🛡",
    color: "rgba(112, 255, 210, 0.78)",
    weight: ITEM_CONFIG.shield.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 3,
    startSettingsVisibleOrder: 3,
    roleTag: "defense",
    encounterBias: "boss",
    sfxEvent: "item_shield",
    synergyTags: ["survival"],
    counterplayTags: ["boss_break", "sweep_alert", "survival_check"],
    previewAffinity: ["survival_check", "boss_break"],
    presentation: createPresentation({ flashMs: 90, shakePx: 1.4, auraMs: 680 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.shieldCharges += 1;
    }),
    getLabelStack: (stacks) => stacks.shieldCharges,
  },
  multiball: {
    type: "multiball",
    stackKey: "multiballStacks",
    icon: "🎱",
    color: "rgba(197, 143, 255, 0.82)",
    weight: ITEM_CONFIG.multiball.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 4,
    startSettingsVisibleOrder: 4,
    roleTag: "attack",
    sfxEvent: "item_multiball",
    synergyTags: ["offense"],
    counterplayTags: ["relay_chain", "reactor_chain"],
    previewAffinity: ["reactor_chain", "boss_break"],
    presentation: createPresentation({ flashMs: 96, auraMs: 720 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.multiballStacks += 1;
    }),
    getLabelStack: (stacks) => stacks.multiballStacks,
  },
  pierce: {
    type: "pierce",
    stackKey: "pierceStacks",
    icon: "🗡",
    color: "rgba(255, 130, 110, 0.86)",
    weight: ITEM_CONFIG.pierce.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: true,
    hudOrder: 5,
    startSettingsVisibleOrder: 5,
    roleTag: "attack",
    encounterBias: "boss",
    sfxEvent: "item_pierce",
    synergyTags: ["offense", "boss_break"],
    counterplayTags: ["shielded_grid", "fortress_core", "boss_break"],
    previewAffinity: ["shielded_grid", "fortress_core", "boss_break"],
    presentation: createPresentation({ flashMs: 108, hitFreezeMs: 24, shakePx: 2.2 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.pierceStacks = 1;
    }),
    getLabelStack: (stacks) => Math.min(1, stacks.pierceStacks),
  },
  bomb: {
    type: "bomb",
    stackKey: "bombStacks",
    icon: "💣",
    color: "rgba(255, 95, 95, 0.88)",
    weight: ITEM_CONFIG.bomb.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: true,
    hudOrder: 6,
    startSettingsVisibleOrder: 6,
    roleTag: "attack",
    sfxEvent: "item_bomb",
    synergyTags: ["offense"],
    counterplayTags: ["relay_chain", "reactor_chain", "turret_lane"],
    previewAffinity: ["reactor_chain", "turret_lane"],
    presentation: createPresentation({ flashMs: 112, hitFreezeMs: 26, shakeMs: 76, shakePx: 2.6 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.bombStacks = 1;
    }),
    getLabelStack: (stacks) => stacks.bombStacks,
  },
  shockwave: {
    type: "shockwave",
    stackKey: "shockwaveStacks",
    icon: "🌊",
    color: "rgba(122, 234, 255, 0.92)",
    weight: ITEM_CONFIG.shockwave.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: false,
    hudOrder: 7,
    startSettingsVisibleOrder: 7,
    roleTag: "attack",
    sfxEvent: "item_shockwave",
    synergyTags: ["offense", "control"],
    counterplayTags: ["relay_chain", "reactor_chain"],
    previewAffinity: ["relay_chain", "reactor_chain"],
    presentation: createPresentation({
      flashMs: 128,
      hitFreezeMs: 30,
      shakeMs: 84,
      shakePx: 2.8,
      auraMs: 760,
    }),
    applyPickup: ({ stacks, balls, state, scorePerBrick }) => {
      stacks.shockwaveStacks = 0;
      if (!state) {
        return;
      }
      return buildShockwaveImpact(
        balls,
        "combat" in state ? state.combat.bricks : state.bricks,
        scorePerBrick ?? 0,
      );
    },
    getLabelStack: (stacks) => stacks.shockwaveStacks,
  },
  pulse: {
    type: "pulse",
    stackKey: "pulseStacks",
    icon: "📳",
    color: "rgba(166, 223, 255, 0.92)",
    weight: ITEM_CONFIG.pulse.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: false,
    hudOrder: 8,
    startSettingsVisibleOrder: 8,
    roleTag: "attack",
    encounterBias: "midboss",
    sfxEvent: "item_pulse",
    synergyTags: ["offense", "boss_break"],
    counterplayTags: ["turret_lane", "boss_break"],
    previewAffinity: ["boss_break", "turret_lane"],
    presentation: createPresentation({ flashMs: 104, auraMs: 740 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.pulseStacks = 1;
    }),
    getLabelStack: (stacks) => stacks.pulseStacks,
  },
  laser: {
    type: "laser",
    stackKey: "laserStacks",
    icon: "🔫",
    color: "rgba(255, 122, 122, 0.88)",
    weight: ITEM_CONFIG.laser.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 9,
    startSettingsVisibleOrder: 9,
    roleTag: "attack",
    encounterBias: "boss",
    sfxEvent: "item_laser",
    synergyTags: ["offense", "boss_break"],
    counterplayTags: ["turret_lane", "shielded_grid", "fortress_core"],
    previewAffinity: ["fortress_core", "boss_break", "shielded_grid"],
    presentation: createPresentation({ flashMs: 100, hitFreezeMs: 20 }),
    respectsNewStackSetting: true,
    applyPickup: noImpact(({ stacks }) => {
      stacks.laserStacks = Math.min(2, stacks.laserStacks + 1);
    }),
    getLabelStack: (stacks) => stacks.laserStacks,
  },
  homing: {
    type: "homing",
    stackKey: "homingStacks",
    icon: "🛰",
    color: "rgba(136, 197, 255, 0.88)",
    weight: ITEM_CONFIG.homing.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 10,
    startSettingsVisibleOrder: 10,
    roleTag: "control",
    sfxEvent: "item_homing",
    synergyTags: ["control", "offense"],
    counterplayTags: ["relay_chain", "reactor_chain", "boss_break"],
    previewAffinity: ["relay_chain", "boss_break"],
    presentation: createPresentation({ flashMs: 88 }),
    respectsNewStackSetting: true,
    applyPickup: noImpact(({ stacks }) => {
      stacks.homingStacks = Math.min(2, stacks.homingStacks + 1);
    }),
    getLabelStack: (stacks) => stacks.homingStacks,
  },
  rail: {
    type: "rail",
    stackKey: "railStacks",
    icon: "⚡",
    color: "rgba(255, 206, 128, 0.9)",
    weight: ITEM_CONFIG.rail.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 11,
    startSettingsVisibleOrder: 11,
    roleTag: "attack",
    encounterBias: "boss",
    sfxEvent: "item_rail",
    synergyTags: ["offense", "boss_break"],
    counterplayTags: ["fortress_core", "shielded_grid", "boss_break"],
    previewAffinity: ["fortress_core", "boss_break"],
    presentation: createPresentation({ flashMs: 96, shakePx: 2.1 }),
    respectsNewStackSetting: true,
    applyPickup: noImpact(({ stacks }) => {
      stacks.railStacks = Math.min(2, stacks.railStacks + 1);
    }),
    getLabelStack: (stacks) => stacks.railStacks,
  },
};
