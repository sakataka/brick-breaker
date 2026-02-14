import { THEME_BANDS, type ThemeBandId } from "../config";

export interface RenderTheme {
  backdropStart: string;
  backdropEnd: string;
  backdropStroke: string;
  overlayTint: string;
  progressBar: string;
  brickGlow: string;
  brickStroke: string;
  paddleStart: string;
  paddleEnd: string;
  paddleStroke: string;
  paddleText: string;
  ballCore: string;
  ballStroke: string;
  trail: string;
  flash: string;
  itemText: string;
  shield: string;
}

export const DEFAULT_RENDER_THEME: RenderTheme = {
  backdropStart: "rgba(255, 255, 255, 0.25)",
  backdropEnd: "rgba(255, 255, 255, 0.04)",
  backdropStroke: "rgba(255, 255, 255, 0.2)",
  overlayTint: "rgba(255, 255, 255, 0.04)",
  progressBar: "rgba(41, 211, 255, 0.9)",
  brickGlow: "rgba(255, 255, 255, 0.08)",
  brickStroke: "rgba(255, 255, 255, 0.45)",
  paddleStart: "rgba(255, 255, 255, 0.94)",
  paddleEnd: "rgba(160, 200, 255, 0.86)",
  paddleStroke: "rgba(255, 255, 255, 0.7)",
  paddleText: "rgba(255, 255, 255, 1)",
  ballCore: "rgba(77, 165, 255, 0.9)",
  ballStroke: "rgba(255, 255, 255, 0.8)",
  trail: "rgba(153, 220, 255, 0.22)",
  flash: "rgba(255, 100, 100, 1)",
  itemText: "rgba(235, 244, 255, 1)",
  shield: "rgba(116, 255, 229, 0.66)",
};

export function resolveRenderTheme(
  themeBandId: ThemeBandId,
  baseTheme: RenderTheme,
  highContrast = false,
): RenderTheme {
  const band = THEME_BANDS.find((candidate) => candidate.id === themeBandId) ?? THEME_BANDS[0];
  const theme: RenderTheme = {
    ...baseTheme,
    backdropStart: band.backdropStart,
    backdropEnd: band.backdropEnd,
    backdropStroke: band.backdropStroke,
    progressBar: band.progressBar,
  };
  if (!highContrast) {
    return theme;
  }
  return {
    ...theme,
    backdropStart: "rgba(0, 0, 0, 0.94)",
    backdropEnd: "rgba(0, 0, 0, 0.78)",
    backdropStroke: "rgba(255, 255, 255, 0.95)",
    progressBar: "rgba(255, 234, 102, 1)",
    brickStroke: "rgba(255, 255, 255, 1)",
    paddleText: "rgba(255, 255, 255, 1)",
    itemText: "rgba(255, 255, 255, 1)",
    overlayTint: "rgba(0, 0, 0, 0.24)",
  };
}
