import type Phaser from "phaser";
import type { VisualAssetProfile } from "../../../../art/visualAssets";
import type { RenderTheme } from "../../../../game-v2/public/renderTheme";

export interface DrawWorldOptions {
  offsetX: number;
  offsetY: number;
  lineWidth: number;
  heavyLineWidth: number;
  snapStep: number;
  brickFillAlphaMin: number;
  brickStrokeAlpha: number;
  brickCornerRadius: number;
  theme: RenderTheme;
  width: number;
  height: number;
  fallbackBrickPalette: readonly string[];
  assetProfile: VisualAssetProfile;
}

export type WorldGraphics = Phaser.GameObjects.Graphics;
