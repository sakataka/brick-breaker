import type { CollisionEvent, Particle, RandomSource, Scene, Vector2, VfxState } from "./types";

const MAX_PARTICLES = 220;
const MAX_TRAIL_POINTS = 8;

export function createVfxState(reducedMotion: boolean): VfxState {
  return {
    particles: [],
    flashMs: 0,
    shakeMs: 0,
    shakePx: 0,
    shakeOffset: { x: 0, y: 0 },
    trail: [],
    densityScale: 1,
    reducedMotion,
  };
}

export function nextDensityScale(current: number, deltaSec: number, scene: Scene): number {
  if (scene !== "playing") {
    return current;
  }

  if (deltaSec > 1 / 30) {
    return Math.max(0.45, current - 0.14);
  }

  return Math.min(1, current + 0.04);
}

export function computeParticleSpawnCount(
  baseCount: number,
  densityScale: number,
  reducedMotion: boolean,
): number {
  const reduction = reducedMotion ? 0.5 : 1;
  return Math.max(1, Math.round(baseCount * densityScale * reduction));
}

export function applyCollisionEvents(vfx: VfxState, events: CollisionEvent[], random: RandomSource): void {
  for (const event of events) {
    if (event.kind === "brick") {
      spawnParticles(vfx, event, 14, 260, event.color ?? "rgba(255, 196, 118, 0.95)", random);
      bumpShake(vfx, 1.4, 45);
      continue;
    }

    if (event.kind === "paddle" || event.kind === "wall") {
      spawnParticles(vfx, event, 4, 140, "rgba(180, 230, 255, 0.95)", random);
      continue;
    }

    if (event.kind === "miss") {
      spawnParticles(vfx, event, 18, 220, "rgba(255, 108, 108, 0.95)", random);
      vfx.flashMs = Math.max(vfx.flashMs, vfx.reducedMotion ? 90 : 180);
      bumpShake(vfx, 4, vfx.reducedMotion ? 0 : 90);
    }
  }
}

export function updateVfxState(vfx: VfxState, deltaSec: number, random: RandomSource): void {
  const deltaMs = deltaSec * 1000;
  vfx.flashMs = Math.max(0, vfx.flashMs - deltaMs);
  vfx.shakeMs = Math.max(0, vfx.shakeMs - deltaMs);
  if (vfx.shakeMs <= 0 || vfx.shakePx <= 0 || vfx.reducedMotion) {
    vfx.shakePx = vfx.shakeMs <= 0 ? 0 : vfx.shakePx;
    vfx.shakeOffset = { x: 0, y: 0 };
  } else {
    const intensity = vfx.shakePx * Math.min(1, vfx.shakeMs / 150);
    vfx.shakeOffset = {
      x: (random.next() * 2 - 1) * intensity,
      y: (random.next() * 2 - 1) * intensity,
    };
  }

  vfx.particles = vfx.particles.filter((particle) => {
    particle.lifeMs -= deltaMs;
    if (particle.lifeMs <= 0) {
      return false;
    }

    particle.pos.x += particle.vel.x * deltaSec;
    particle.pos.y += particle.vel.y * deltaSec;
    particle.vel.x *= 0.94;
    particle.vel.y *= 0.94;
    return true;
  });
}

export function recordTrailPoint(vfx: VfxState, scene: Scene, point?: Vector2): void {
  if (scene !== "playing") {
    if (scene !== "paused") {
      vfx.trail = [];
    }
    return;
  }

  if (!point) {
    return;
  }

  vfx.trail.push({
    x: point.x,
    y: point.y,
  });

  while (vfx.trail.length > MAX_TRAIL_POINTS) {
    vfx.trail.shift();
  }
}

function bumpShake(vfx: VfxState, shakePx: number, durationMs: number): void {
  if (vfx.reducedMotion || durationMs <= 0) {
    return;
  }

  vfx.shakeMs = Math.max(vfx.shakeMs, durationMs);
  vfx.shakePx = Math.max(vfx.shakePx, shakePx);
}

function spawnParticles(
  vfx: VfxState,
  event: CollisionEvent,
  baseCount: number,
  lifeMs: number,
  color: string,
  random: RandomSource,
): void {
  const count = computeParticleSpawnCount(baseCount, vfx.densityScale, vfx.reducedMotion);
  for (let i = 0; i < count; i += 1) {
    if (vfx.particles.length >= MAX_PARTICLES) {
      vfx.particles.shift();
    }

    const angle = (Math.PI * 2 * i) / count + random.next() * 0.55;
    const speed = 100 + random.next() * 160;
    const particle: Particle = {
      pos: { x: event.x, y: event.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      lifeMs,
      maxLifeMs: lifeMs,
      size: 1.8 + random.next() * 3.2,
      color,
    };
    vfx.particles.push(particle);
  }
}
