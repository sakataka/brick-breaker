import { describe, expect, test } from 'bun:test';

import { computeCanvasFit, computeParticleSpawnCount, nextDensityScale, shouldAutoPauseOnVisibility } from './Game';

describe('computeCanvasFit', () => {
  test('falls back to minimum size when wrapper is zero', () => {
    const fit = computeCanvasFit(0, 0, 16 / 9);
    expect(fit.cssWidth).toBe(320);
    expect(fit.cssHeight).toBe(180);
  });

  test('keeps aspect ratio in regular layout', () => {
    const fit = computeCanvasFit(1000, 600, 16 / 9);
    expect(Math.round(fit.cssWidth)).toBe(1000);
    expect(Math.round(fit.cssHeight)).toBe(563);
  });
});

describe('shouldAutoPauseOnVisibility', () => {
  test('returns true only for playing scene and hidden state', () => {
    expect(shouldAutoPauseOnVisibility('playing', 'hidden')).toBe(true);
    expect(shouldAutoPauseOnVisibility('paused', 'hidden')).toBe(false);
    expect(shouldAutoPauseOnVisibility('playing', 'visible')).toBe(false);
  });
});

describe('VFX helpers', () => {
  test('nextDensityScale drops during low FPS and recovers otherwise', () => {
    expect(nextDensityScale(1, 0.05, 'playing')).toBeLessThan(1);
    expect(nextDensityScale(0.46, 0.08, 'playing')).toBeGreaterThanOrEqual(0.45);
    expect(nextDensityScale(0.6, 1 / 120, 'playing')).toBeGreaterThan(0.6);
    expect(nextDensityScale(0.6, 1 / 120, 'paused')).toBe(0.6);
  });

  test('computeParticleSpawnCount respects reduced motion', () => {
    expect(computeParticleSpawnCount(14, 1, false)).toBe(14);
    expect(computeParticleSpawnCount(14, 1, true)).toBe(7);
    expect(computeParticleSpawnCount(14, 0.5, false)).toBe(7);
    expect(computeParticleSpawnCount(1, 0.1, true)).toBe(1);
  });
});
