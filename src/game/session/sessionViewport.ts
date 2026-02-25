import { applyCanvasViewport } from "../viewport";

export function applySessionViewport(
  canvas: HTMLCanvasElement,
  wrapper: HTMLElement,
  worldWidth: number,
  worldHeight: number,
  rawDpr: number,
): number {
  const devicePixelRatio = Math.max(1, Math.min(4, rawDpr || 1));
  applyCanvasViewport(canvas, wrapper, worldWidth, worldHeight, devicePixelRatio, {
    resizeBuffer: false,
  });
  return devicePixelRatio;
}
