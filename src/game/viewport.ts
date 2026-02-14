import { clamp } from "./math";

export const MIN_CANVAS_CSS_WIDTH = 320;
export const MIN_CANVAS_CSS_HEIGHT = 180;
export const MAX_RENDER_SCALE = 4;

export interface CanvasFit {
  cssWidth: number;
  cssHeight: number;
}

export interface ViewportResult {
  fit: CanvasFit;
  renderScale: number;
}

export interface ViewportOptions {
  resizeBuffer?: boolean;
}

export function computeCanvasFit(
  wrapperWidth: number,
  wrapperHeight: number,
  ratio: number,
  minWidth = MIN_CANVAS_CSS_WIDTH,
  minHeight = MIN_CANVAS_CSS_HEIGHT,
): CanvasFit {
  const width = Math.max(minWidth, wrapperWidth);
  const height = Math.max(minHeight, wrapperHeight);

  const fitHeight = width / ratio;
  if (fitHeight <= height) {
    return {
      cssWidth: width,
      cssHeight: fitHeight,
    };
  }

  return {
    cssWidth: height * ratio,
    cssHeight: height,
  };
}

export function computeRenderScale(
  cssWidth: number,
  cssHeight: number,
  worldWidth: number,
  worldHeight: number,
  devicePixelRatio = window.devicePixelRatio || 1,
  maxRenderScale = MAX_RENDER_SCALE,
): number {
  const widthScale = (cssWidth * devicePixelRatio) / worldWidth;
  const heightScale = (cssHeight * devicePixelRatio) / worldHeight;
  const idealScale = Math.min(widthScale, heightScale);
  return clamp(idealScale, 1, maxRenderScale);
}

export function applyCanvasViewport(
  canvas: HTMLCanvasElement,
  wrapper: HTMLElement,
  worldWidth: number,
  worldHeight: number,
  devicePixelRatio = window.devicePixelRatio || 1,
  options: ViewportOptions = {},
): ViewportResult {
  const ratio = worldWidth / worldHeight;
  const fit = computeCanvasFit(wrapper.clientWidth, wrapper.clientHeight, ratio);
  const renderScale = computeRenderScale(
    fit.cssWidth,
    fit.cssHeight,
    worldWidth,
    worldHeight,
    devicePixelRatio,
  );

  if (options.resizeBuffer ?? true) {
    canvas.width = Math.round(worldWidth * renderScale);
    canvas.height = Math.round(worldHeight * renderScale);
  }
  canvas.style.width = `${fit.cssWidth}px`;
  canvas.style.height = `${fit.cssHeight}px`;

  return {
    fit,
    renderScale,
  };
}
