import type Phaser from "phaser";
import { THEME_BANDS } from "../../game/config";
import { getItemEmoji, getItemShortLabel } from "../../game/itemRegistry";
import { DEFAULT_RENDER_THEME, resolveRenderTheme } from "../../game/renderer/theme";
import type { RenderViewState } from "../../game/renderTypes";
import type { GameConfig } from "../../game/types";
import { readDevicePixelRatio, snapPixel } from "./color";
import { drawBackdropLayer } from "./layers/backdrop";
import { drawEffectsLayer } from "./layers/effects";
import { drawOverlayLayer } from "./layers/overlay";
import { drawWorldLayer } from "./layers/world";

interface ItemLabelNodes {
  emoji: Phaser.GameObjects.Text;
  short: Phaser.GameObjects.Text;
}

export class PhaserRenderPort {
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private readonly world: Phaser.GameObjects.Graphics;
  private readonly effects: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly itemLabels = new Map<number, ItemLabelNodes>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: Pick<GameConfig, "width" | "height">,
  ) {
    this.backdrop = this.scene.add.graphics().setDepth(-100);
    this.world = this.scene.add.graphics().setDepth(0);
    this.effects = this.scene.add.graphics().setDepth(10);
    this.overlay = this.scene.add.graphics().setDepth(50);
  }

  render(view: RenderViewState): void {
    const theme = resolveRenderTheme(view.themeBandId, DEFAULT_RENDER_THEME, view.highContrast);
    const band = THEME_BANDS.find((candidate) => candidate.id === view.themeBandId) ?? THEME_BANDS[0];
    const offsetX = view.shake.active ? view.shake.offset.x : 0;
    const offsetY = view.shake.active ? view.shake.offset.y : 0;
    const dpr = readDevicePixelRatio(this.scene);
    const lineWidth = dpr >= 1.5 ? 1.4 : 1.2;
    const heavyLineWidth = dpr >= 1.5 ? 1.7 : 1.4;

    this.backdrop.clear();
    this.world.clear();
    this.effects.clear();
    this.overlay.clear();

    drawBackdropLayer(
      this.backdrop,
      view,
      this.config.width,
      this.config.height,
      theme.progressBar,
      lineWidth,
    );

    const visibleItemIds = drawWorldLayer(this.world, view, {
      offsetX,
      offsetY,
      lineWidth,
      heavyLineWidth,
      theme,
      width: this.config.width,
      height: this.config.height,
      fallbackBrickPalette: band.brickPalette,
    });
    drawEffectsLayer(this.effects, view, offsetX, offsetY);
    drawOverlayLayer(this.overlay, view, this.config.width, this.config.height, theme);
    this.syncFallingItemLabels(view, visibleItemIds, offsetX, offsetY);
  }

  destroy(): void {
    this.clearItemLabels();
    this.backdrop.destroy();
    this.world.destroy();
    this.effects.destroy();
    this.overlay.destroy();
  }

  private syncFallingItemLabels(
    view: RenderViewState,
    visibleItemIds: Set<number>,
    offsetX: number,
    offsetY: number,
  ): void {
    for (const item of view.fallingItems) {
      let nodes = this.itemLabels.get(item.id);
      if (!nodes) {
        nodes = {
          emoji: this.scene.add
            .text(0, 0, getItemEmoji(item.type), {
              fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
              fontSize: "12px",
              color: "#ffffff",
            })
            .setDepth(9)
            .setOrigin(0.5, 0.65),
          short: this.scene.add
            .text(0, 0, getItemShortLabel(item.type), {
              fontFamily: '"Avenir Next", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
              fontSize: "8px",
              color: "#f7fcff",
              stroke: "#0b1320",
              strokeThickness: 2,
            })
            .setDepth(9)
            .setOrigin(0.5, -0.2),
        };
        this.itemLabels.set(item.id, nodes);
      }

      nodes.emoji.setPosition(snapPixel(item.pos.x + offsetX), snapPixel(item.pos.y + offsetY));
      nodes.short.setPosition(snapPixel(item.pos.x + offsetX), snapPixel(item.pos.y + offsetY));
      nodes.emoji.setVisible(true);
      nodes.short.setVisible(true);
    }

    for (const [id, nodes] of this.itemLabels.entries()) {
      if (visibleItemIds.has(id)) {
        continue;
      }
      nodes.emoji.destroy();
      nodes.short.destroy();
      this.itemLabels.delete(id);
    }
  }

  private clearItemLabels(): void {
    for (const nodes of this.itemLabels.values()) {
      nodes.emoji.destroy();
      nodes.short.destroy();
    }
    this.itemLabels.clear();
  }
}
