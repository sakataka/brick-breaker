import Phaser from "phaser";
import {
  getBackdropTileSet,
  resolveVisualAssetProfile,
  type VisualAssetProfile,
} from "../../art/visualAssets";
import { THEME_BANDS } from "../../game/config";
import { getItemColor } from "../../game/itemRegistry";
import { DEFAULT_RENDER_THEME, resolveRenderThemeFromTokens } from "../../game/renderer/theme";
import type { RenderViewState } from "../../game/renderTypes";
import type { GameConfig } from "../../game/types";
import { getCurrentLocale, getItemTranslation, getLL } from "../../i18n";
import { parseColor, readDevicePixelRatio, snapPixel } from "./color";
import { resolveDpiRenderProfile } from "./dpiProfile";
import { drawBackdropLayer } from "./layers/backdrop";
import { drawEffectsLayer } from "./layers/effects";
import { drawOverlayLayer } from "./layers/overlay";
import { drawWorldLayer } from "./layers/world";

interface ItemLabelNodes {
  short: Phaser.GameObjects.Text;
}

export class PhaserRenderPort {
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private readonly backdropPattern: Phaser.GameObjects.TileSprite;
  private readonly backdropMotif: Phaser.GameObjects.TileSprite;
  private readonly backdropWarning: Phaser.GameObjects.TileSprite;
  private readonly world: Phaser.GameObjects.Graphics;
  private readonly effects: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly itemLabels = new Map<number, ItemLabelNodes>();
  private lastBackdropTextureKey = "";
  private lastMotifTextureKey = "";
  private lastWarningTextureKey = "";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: Pick<GameConfig, "width" | "height">,
  ) {
    const initialAssets = resolveVisualAssetProfile("chapter1", "calm", "chapter");
    const initialBackdrop = getBackdropTileSet(initialAssets);
    this.backdrop = this.scene.add.graphics().setDepth(-100);
    this.backdropPattern = this.scene.add
      .tileSprite(
        this.config.width / 2,
        this.config.height / 2,
        this.config.width,
        this.config.height,
        initialBackdrop.patternTextureKey,
      )
      .setDepth(-99)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);
    this.backdropMotif = this.scene.add
      .tileSprite(
        this.config.width / 2,
        this.config.height / 2,
        this.config.width,
        this.config.height,
        initialBackdrop.motifTextureKey,
      )
      .setDepth(-98)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);
    this.backdropWarning = this.scene.add
      .tileSprite(
        this.config.width / 2,
        this.config.height / 2,
        this.config.width,
        this.config.height,
        initialAssets.warning.stripeTextureKey,
      )
      .setDepth(-97)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);
    this.world = this.scene.add.graphics().setDepth(0);
    this.effects = this.scene.add.graphics().setDepth(10);
    this.overlay = this.scene.add.graphics().setDepth(50);
  }

  render(view: RenderViewState): void {
    const artProfile = resolveVisualAssetProfile(
      view.visual.assetProfileId,
      view.visual.warningLevel,
      view.visual.encounterEmphasis,
    );
    const theme = resolveRenderThemeFromTokens(view.visual.tokens, DEFAULT_RENDER_THEME);
    const band = THEME_BANDS.find((candidate) => candidate.id === view.themeBandId) ?? THEME_BANDS[0];
    const offsetX = view.shake.active ? view.shake.offset.x : 0;
    const offsetY = view.shake.active ? view.shake.offset.y : 0;
    const profile = resolveDpiRenderProfile(readDevicePixelRatio(this.scene));

    this.backdrop.clear();
    this.world.clear();
    this.effects.clear();
    this.overlay.clear();
    this.syncBackdropArt(view, artProfile);

    drawBackdropLayer(
      this.backdrop,
      view,
      this.config.width,
      this.config.height,
      theme.progressBar,
      profile.lineWidth,
      profile.snapStep,
    );

    const visibleItemIds = drawWorldLayer(this.world, view, {
      offsetX,
      offsetY,
      lineWidth: profile.lineWidth,
      heavyLineWidth: profile.heavyLineWidth,
      snapStep: profile.snapStep,
      brickFillAlphaMin: profile.brickFillAlphaMin,
      brickStrokeAlpha: profile.brickStrokeAlpha,
      brickCornerRadius: profile.brickCornerRadius,
      theme,
      width: this.config.width,
      height: this.config.height,
      fallbackBrickPalette: band.brickPalette,
      assetProfile: artProfile,
    });
    drawEffectsLayer(this.effects, view, offsetX, offsetY, {
      lineWidth: profile.lineWidth,
      snapStep: profile.snapStep,
    });
    drawOverlayLayer(this.overlay, view, this.config.width, this.config.height, theme);
    this.syncFallingItemLabels(view, visibleItemIds, offsetX, offsetY);
  }

  destroy(): void {
    this.clearItemLabels();
    this.backdrop.destroy();
    this.backdropPattern.destroy();
    this.backdropMotif.destroy();
    this.backdropWarning.destroy();
    this.world.destroy();
    this.effects.destroy();
    this.overlay.destroy();
  }

  private syncBackdropArt(view: RenderViewState, artProfile: VisualAssetProfile): void {
    const backdrop = getBackdropTileSet(artProfile);
    if (this.lastBackdropTextureKey !== backdrop.patternTextureKey) {
      this.backdropPattern.setTexture(backdrop.patternTextureKey);
      this.lastBackdropTextureKey = backdrop.patternTextureKey;
    }
    if (this.lastMotifTextureKey !== backdrop.motifTextureKey) {
      this.backdropMotif.setTexture(backdrop.motifTextureKey);
      this.lastMotifTextureKey = backdrop.motifTextureKey;
    }
    if (this.lastWarningTextureKey !== artProfile.warning.stripeTextureKey) {
      this.backdropWarning.setTexture(artProfile.warning.stripeTextureKey);
      this.lastWarningTextureKey = artProfile.warning.stripeTextureKey;
    }

    const patternColor = parseColor(view.visual.tokens.pattern, { value: 0xffffff, alpha: 1 });
    const accentColor = parseColor(view.visual.tokens.accent, { value: 0x40f4ff, alpha: 1 });
    const warningColor = parseColor(view.visual.tokens.danger, { value: 0xff6a6a, alpha: 1 });

    this.backdropPattern.setTint(patternColor.value);
    this.backdropPattern.setAlpha(backdrop.patternOpacity * Math.max(0.7, artProfile.density));
    this.backdropPattern.tilePositionX = view.elapsedSec * 18 * backdrop.patternScrollX;
    this.backdropPattern.tilePositionY = view.elapsedSec * 5;
    this.backdropPattern.tileScaleX = artProfile.textureScale;
    this.backdropPattern.tileScaleY = artProfile.textureScale;
    this.backdropPattern.setBlendMode(Phaser.BlendModes.SCREEN);

    this.backdropMotif.setTint(accentColor.value);
    this.backdropMotif.setAlpha(backdrop.motifOpacity);
    this.backdropMotif.tilePositionX = view.elapsedSec * 8 * backdrop.motifScrollX;
    this.backdropMotif.tilePositionY = view.elapsedSec * 3;
    this.backdropMotif.tileScaleX = artProfile.textureScale;
    this.backdropMotif.tileScaleY = artProfile.textureScale;
    this.backdropMotif.setBlendMode(
      view.visual.encounterEmphasis === "chapter" ? Phaser.BlendModes.ADD : Phaser.BlendModes.SCREEN,
    );

    this.backdropWarning.setVisible(view.visual.warningLevel !== "calm");
    this.backdropWarning.setTint(warningColor.value);
    this.backdropWarning.setAlpha(artProfile.warning.stripeOpacity);
    this.backdropWarning.tilePositionX = view.elapsedSec * -20;
    this.backdropWarning.tilePositionY = 0;
    this.backdropWarning.tileScaleX = artProfile.textureScale;
    this.backdropWarning.tileScaleY = artProfile.textureScale;
    this.backdropWarning.setBlendMode(Phaser.BlendModes.ADD);
  }

  private syncFallingItemLabels(
    view: RenderViewState,
    visibleItemIds: Set<number>,
    offsetX: number,
    offsetY: number,
  ): void {
    const LL = getLL(getCurrentLocale());
    for (const item of view.fallingItems) {
      let nodes = this.itemLabels.get(item.id);
      if (!nodes) {
        nodes = {
          short: this.scene.add
            .text(0, 0, getItemTranslation(LL, item.type).short(), {
              fontFamily: '"Public Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
              fontSize: "9px",
              color: getItemColor(item.type),
              stroke: "#0b1320",
              strokeThickness: 2,
            })
            .setDepth(9)
            .setOrigin(0.5, 0.5),
        };
        this.itemLabels.set(item.id, nodes);
      }
      nodes.short.setText(getItemTranslation(LL, item.type).short());
      nodes.short.setColor(getItemColor(item.type));

      nodes.short.setPosition(snapPixel(item.pos.x + offsetX), snapPixel(item.pos.y + offsetY));
      nodes.short.setVisible(true);
    }

    for (const [id, nodes] of this.itemLabels.entries()) {
      if (visibleItemIds.has(id)) {
        continue;
      }
      nodes.short.destroy();
      this.itemLabels.delete(id);
    }
  }

  private clearItemLabels(): void {
    for (const nodes of this.itemLabels.values()) {
      nodes.short.destroy();
    }
    this.itemLabels.clear();
  }
}
