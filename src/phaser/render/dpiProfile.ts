import { clamp } from "../../game-v2/public/math";

export interface DpiRenderProfile {
  dpr: number;
  snapStep: number;
  lineWidth: number;
  heavyLineWidth: number;
  brickFillAlphaMin: number;
  brickStrokeAlpha: number;
  brickCornerRadius: number;
}

export function resolveDpiRenderProfile(rawDpr: number): DpiRenderProfile {
  const dpr = clamp(rawDpr, 1, 4);
  const snapStep = 1 / dpr;
  if (dpr >= 3) {
    return {
      dpr,
      snapStep,
      lineWidth: 1,
      heavyLineWidth: 1.2,
      brickFillAlphaMin: 0.92,
      brickStrokeAlpha: 1,
      brickCornerRadius: 1.6,
    };
  }
  if (dpr >= 2) {
    return {
      dpr,
      snapStep,
      lineWidth: 1.1,
      heavyLineWidth: 1.35,
      brickFillAlphaMin: 0.88,
      brickStrokeAlpha: 0.98,
      brickCornerRadius: 2,
    };
  }
  return {
    dpr,
    snapStep,
    lineWidth: 1.25,
    heavyLineWidth: 1.55,
    brickFillAlphaMin: 0.84,
    brickStrokeAlpha: 0.94,
    brickCornerRadius: 2.4,
  };
}

export function snapByStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}
