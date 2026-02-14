import { drawBackdrop, drawProgressBar } from "./renderer/layers/backdrop";
import { drawBricks } from "./renderer/layers/bricks";
import { drawFlash, drawFloatingTexts, drawImpactRings, drawParticles } from "./renderer/layers/effects";
import { drawBallIndicators, drawBalls, drawPaddle, drawShield, drawTrail } from "./renderer/layers/entities";
import { drawFallingItems } from "./renderer/layers/items";
import { DEFAULT_RENDER_THEME, type RenderTheme, resolveRenderTheme } from "./renderer/theme";
import type { RenderViewState } from "./renderTypes";
import type { GameConfig } from "./types";

export class Renderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly config: GameConfig,
    private readonly baseTheme: RenderTheme = DEFAULT_RENDER_THEME,
  ) {}

  setRenderScale(next: number): void {
    const scale = Math.max(1, next);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  render(view: RenderViewState): void {
    const theme = resolveRenderTheme(view.themeBandId, this.baseTheme, view.highContrast);
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.ctx.save();
    this.applyShake(view);

    drawBackdrop(this.ctx, this.config, theme);
    drawProgressBar(this.ctx, this.config, view.progressRatio, theme);
    drawBricks(this.ctx, view.bricks, theme, view.highContrast);
    drawPaddle(this.ctx, view.paddle, view.elapsedSec, theme);
    drawShield(this.ctx, this.config, view.shieldCharges, view.elapsedSec, theme);
    drawTrail(this.ctx, this.config, view.trail, view.balls[0], view.slowBallActive, theme);
    drawBallIndicators(this.ctx, this.config, view.balls, view.paddle.y);
    drawBalls(this.ctx, view.balls, view.slowBallActive, view.multiballActive, view.reducedMotion, theme);
    drawFallingItems(this.ctx, view.fallingItems, view.reducedMotion, theme, view.highContrast);
    drawImpactRings(this.ctx, view.impactRings);
    drawFloatingTexts(this.ctx, view.floatingTexts);
    drawParticles(this.ctx, view.particles);
    drawFlash(this.ctx, this.config, view.flashMs, theme);

    if (view.showSceneOverlayTint) {
      this.ctx.fillStyle = theme.overlayTint;
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    this.ctx.restore();
  }

  private applyShake(view: RenderViewState): void {
    if (!view.shake.active) {
      return;
    }
    this.ctx.translate(view.shake.offset.x, view.shake.offset.y);
  }
}
