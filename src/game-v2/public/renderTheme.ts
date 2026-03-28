import type { UiThemeTokens } from "./uiTheme";

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

export function resolveRenderThemeFromTokens(
  tokens: UiThemeTokens,
  baseTheme: RenderTheme,
): RenderTheme {
  return {
    ...baseTheme,
    backdropStart: tokens.backdropTop,
    backdropEnd: tokens.backdrop,
    backdropStroke: tokens.frame,
    overlayTint: tokens.accentSoft,
    progressBar: tokens.accent,
    brickGlow: tokens.glow,
    brickStroke: tokens.border,
    paddleStart: tokens.text,
    paddleEnd: tokens.accent,
    paddleStroke: tokens.border,
    paddleText: tokens.text,
    ballCore: tokens.accent,
    ballStroke: tokens.text,
    trail: tokens.accentSoft,
    flash: tokens.danger,
    itemText: tokens.text,
    shield: tokens.success,
  };
}
