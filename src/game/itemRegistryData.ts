import { applyDirectBrickDamage } from "./brickDamage";
import { ITEM_BALANCE, ITEM_CONFIG } from "./config/items";
import type {
  ItemEffectContext,
  ItemPickupImpact,
  ItemPickupPresentation,
  ItemRegistry,
} from "./itemTypes";
import type { Ball, Brick, ItemType } from "./types";

export const ITEM_TYPE_ORDER = [
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
    label: ITEM_CONFIG.paddle_plus.label,
    icon: "🟦",
    hudLabel: "🟦幅増加",
    emoji: "🟦",
    description: "パドル幅を増やす",
    shortLabel: "幅",
    color: "rgba(104, 216, 255, 0.8)",
    weight: ITEM_CONFIG.paddle_plus.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 1,
    startSettingsVisibleOrder: 1,
    roleTag: "control",
    sfxEvent: "item_paddle_plus",
    presentation: createPresentation({ flashMs: 76, auraMs: 620 }),
    debugPresetStacks: { combat_check: 1 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.paddlePlusStacks += 1;
    }),
    getLabelStack: (stacks) => stacks.paddlePlusStacks,
  },
  slow_ball: {
    type: "slow_ball",
    stackKey: "slowBallStacks",
    label: ITEM_CONFIG.slow_ball.label,
    icon: "🐢",
    hudLabel: "🐢スロー",
    emoji: "🐢",
    description: "ボール速度を下げる",
    shortLabel: "遅",
    color: "rgba(255, 191, 112, 0.85)",
    weight: ITEM_CONFIG.slow_ball.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 2,
    startSettingsVisibleOrder: 2,
    roleTag: "control",
    sfxEvent: "item_slow_ball",
    presentation: createPresentation({ flashMs: 92, hitFreezeMs: 18 }),
    debugPresetStacks: { combat_check: 1 },
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
    label: ITEM_CONFIG.shield.label,
    icon: "🛡",
    hudLabel: "🛡シールド",
    emoji: "🛡",
    description: "落球を1回防ぐ",
    shortLabel: "盾",
    color: "rgba(112, 255, 210, 0.78)",
    weight: ITEM_CONFIG.shield.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 3,
    startSettingsVisibleOrder: 3,
    roleTag: "defense",
    encounterBias: "boss",
    sfxEvent: "item_shield",
    presentation: createPresentation({ flashMs: 90, shakePx: 1.4, auraMs: 680 }),
    debugPresetStacks: { combat_check: 1, boss_check: 2 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.shieldCharges += 1;
    }),
    getLabelStack: (stacks) => stacks.shieldCharges,
  },
  multiball: {
    type: "multiball",
    stackKey: "multiballStacks",
    label: ITEM_CONFIG.multiball.label,
    icon: "🎱",
    hudLabel: "🎱マルチ",
    emoji: "🎱",
    description: "ボール数を増やす",
    shortLabel: "多",
    color: "rgba(197, 143, 255, 0.82)",
    weight: ITEM_CONFIG.multiball.weight,
    maxStacks: Number.POSITIVE_INFINITY,
    dropSuppressedWhenActive: false,
    hudOrder: 4,
    startSettingsVisibleOrder: 4,
    roleTag: "attack",
    sfxEvent: "item_multiball",
    presentation: createPresentation({ flashMs: 96, auraMs: 720 }),
    debugPresetStacks: { combat_check: 1 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.multiballStacks += 1;
    }),
    getLabelStack: (stacks) => stacks.multiballStacks,
  },
  pierce: {
    type: "pierce",
    stackKey: "pierceStacks",
    label: ITEM_CONFIG.pierce.label,
    icon: "🗡",
    hudLabel: "🗡貫通",
    emoji: "🗡",
    description: "ブロックを貫通する",
    shortLabel: "貫",
    color: "rgba(255, 130, 110, 0.86)",
    weight: ITEM_CONFIG.pierce.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: true,
    hudOrder: 5,
    startSettingsVisibleOrder: 5,
    roleTag: "attack",
    encounterBias: "boss",
    sfxEvent: "item_pierce",
    presentation: createPresentation({ flashMs: 108, hitFreezeMs: 24, shakePx: 2.2 }),
    debugPresetStacks: { boss_check: 1 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.pierceStacks = 1;
    }),
    getLabelStack: (stacks) => Math.min(1, stacks.pierceStacks),
  },
  bomb: {
    type: "bomb",
    stackKey: "bombStacks",
    label: ITEM_CONFIG.bomb.label,
    icon: "💣",
    hudLabel: "💣ボム",
    emoji: "💣",
    description: "直撃時に範囲破壊",
    shortLabel: "爆",
    color: "rgba(255, 95, 95, 0.88)",
    weight: ITEM_CONFIG.bomb.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: true,
    hudOrder: 6,
    startSettingsVisibleOrder: 6,
    roleTag: "attack",
    sfxEvent: "item_bomb",
    presentation: createPresentation({ flashMs: 112, hitFreezeMs: 26, shakeMs: 76, shakePx: 2.6 }),
    debugPresetStacks: { boss_check: 1 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.bombStacks = 1;
    }),
    getLabelStack: (stacks) => stacks.bombStacks,
  },
  shockwave: {
    type: "shockwave",
    stackKey: "shockwaveStacks",
    label: ITEM_CONFIG.shockwave.label,
    icon: "🌊",
    hudLabel: "🌊衝撃波",
    emoji: "🌊",
    description: "取得時に近くの通常ブロックへ衝撃波",
    shortLabel: "波",
    color: "rgba(122, 234, 255, 0.92)",
    weight: ITEM_CONFIG.shockwave.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: false,
    hudOrder: 7,
    startSettingsVisibleOrder: 7,
    roleTag: "attack",
    sfxEvent: "item_shockwave",
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
      return buildShockwaveImpact(balls, state.bricks, scorePerBrick ?? 0);
    },
    getLabelStack: (stacks) => stacks.shockwaveStacks,
  },
  pulse: {
    type: "pulse",
    stackKey: "pulseStacks",
    label: ITEM_CONFIG.pulse.label,
    icon: "📳",
    hudLabel: "📳パルス",
    emoji: "📳",
    description: "パドル反射時に近距離へ追撃",
    shortLabel: "脈",
    color: "rgba(166, 223, 255, 0.92)",
    weight: ITEM_CONFIG.pulse.weight,
    maxStacks: 1,
    dropSuppressedWhenActive: false,
    hudOrder: 8,
    startSettingsVisibleOrder: 8,
    roleTag: "attack",
    encounterBias: "midboss",
    sfxEvent: "item_pulse",
    presentation: createPresentation({ flashMs: 104, auraMs: 740 }),
    applyPickup: noImpact(({ stacks }) => {
      stacks.pulseStacks = 1;
    }),
    getLabelStack: (stacks) => stacks.pulseStacks,
  },
  laser: {
    type: "laser",
    stackKey: "laserStacks",
    label: ITEM_CONFIG.laser.label,
    icon: "🔫",
    hudLabel: "🔫レーザー",
    emoji: "🔫",
    description: "自動でレーザーを発射",
    shortLabel: "砲",
    color: "rgba(255, 122, 122, 0.88)",
    weight: ITEM_CONFIG.laser.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 9,
    startSettingsVisibleOrder: 9,
    roleTag: "attack",
    encounterBias: "boss",
    sfxEvent: "item_laser",
    presentation: createPresentation({ flashMs: 100, hitFreezeMs: 20 }),
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 2 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.laserStacks = Math.min(2, stacks.laserStacks + 1);
    }),
    getLabelStack: (stacks) => stacks.laserStacks,
  },
  homing: {
    type: "homing",
    stackKey: "homingStacks",
    label: ITEM_CONFIG.homing.label,
    icon: "🛰",
    hudLabel: "🛰ホーミング",
    emoji: "🛰",
    description: "ボール軌道を近くのブロックへ補正",
    shortLabel: "追",
    color: "rgba(136, 197, 255, 0.88)",
    weight: ITEM_CONFIG.homing.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 10,
    startSettingsVisibleOrder: 10,
    roleTag: "control",
    sfxEvent: "item_homing",
    presentation: createPresentation({ flashMs: 88 }),
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 2 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.homingStacks = Math.min(2, stacks.homingStacks + 1);
    }),
    getLabelStack: (stacks) => stacks.homingStacks,
  },
  rail: {
    type: "rail",
    stackKey: "railStacks",
    label: ITEM_CONFIG.rail.label,
    icon: "⚡",
    hudLabel: "⚡レール",
    emoji: "⚡",
    description: "レーザーが複数のブロックを貫く",
    shortLabel: "線",
    color: "rgba(255, 206, 128, 0.9)",
    weight: ITEM_CONFIG.rail.weight,
    maxStacks: 2,
    dropSuppressedWhenActive: false,
    hudOrder: 11,
    startSettingsVisibleOrder: 11,
    roleTag: "attack",
    encounterBias: "boss",
    sfxEvent: "item_rail",
    presentation: createPresentation({ flashMs: 96, shakePx: 2.1 }),
    respectsNewStackSetting: true,
    debugPresetStacks: { boss_check: 2 },
    applyPickup: noImpact(({ stacks }) => {
      stacks.railStacks = Math.min(2, stacks.railStacks + 1);
    }),
    getLabelStack: (stacks) => stacks.railStacks,
  },
};
