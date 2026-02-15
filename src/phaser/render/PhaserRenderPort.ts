import type Phaser from "phaser";
import { THEME_BANDS } from "../../game/config";
import { getItemColor, getItemEmoji, getItemShortLabel } from "../../game/itemRegistry";
import { DEFAULT_RENDER_THEME, resolveRenderTheme } from "../../game/renderer/theme";
import type { RenderViewState } from "../../game/renderTypes";
import type { GameConfig } from "../../game/types";

interface ParsedColor {
  value: number;
  alpha: number;
}

interface BackdropTheme {
  base: string;
  top: string;
  frame: string;
}

interface ItemLabelNodes {
  emoji: Phaser.GameObjects.Text;
  short: Phaser.GameObjects.Text;
}

const BACKDROP_BY_BAND: Record<RenderViewState["themeBandId"], BackdropTheme> = {
  early: {
    base: "#0a1a35",
    top: "#133468",
    frame: "#2d9fff",
  },
  mid: {
    base: "#1a1734",
    top: "#3a2a58",
    frame: "#ffab5e",
  },
  late: {
    base: "#1c1230",
    top: "#47205f",
    frame: "#ff80ba",
  },
};

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

    const backdropTheme = resolveBackdropTheme(view.themeBandId, view.highContrast);
    const background = parseColor(backdropTheme.base, { value: 0x0b1020, alpha: 1 });
    this.backdrop.fillStyle(background.value, 1);
    this.backdrop.fillRect(0, 0, this.config.width, this.config.height);

    const header = parseColor(backdropTheme.top, { value: 0x161d30, alpha: 1 });
    this.backdrop.fillStyle(header.value, 0.72);
    this.backdrop.fillRect(0, 0, this.config.width, 72);
    const frame = parseColor(backdropTheme.frame, { value: 0x29d3ff, alpha: 1 });
    this.backdrop.lineStyle(lineWidth, frame.value, 0.24);
    this.backdrop.strokeRect(0.5, 0.5, this.config.width - 1, this.config.height - 1);

    drawProgressBar(this.backdrop, view.progressRatio, this.config.width, theme.progressBar);
    drawWarpZones(this.backdrop, view.warpZones, lineWidth);

    for (const brick of view.bricks) {
      if (!brick.alive) {
        continue;
      }
      const fallbackColor = band.brickPalette[(brick.row ?? 0) % band.brickPalette.length] ?? "#ffffff";
      const body = parseColor(brick.color ?? fallbackColor, { value: 0xa0c8ff, alpha: 0.55 });
      const stroke = parseColor(theme.brickStroke, { value: 0xffffff, alpha: 0.75 });
      const brickX = snapPixel(brick.x + offsetX);
      const brickY = snapPixel(brick.y + offsetY);
      this.world.fillStyle(body.value, body.alpha);
      this.world.fillRoundedRect(brickX, brickY, brick.width, brick.height, 5);
      this.world.lineStyle(lineWidth, stroke.value, stroke.alpha);
      this.world.strokeRoundedRect(brickX, brickY, brick.width, brick.height, 5);

      if (brick.kind && brick.kind !== "normal") {
        const markerColor = getBrickMarkerColor(brick.kind);
        const marker = parseColor(markerColor, { value: 0xffffff, alpha: 0.95 });
        this.world.fillStyle(marker.value, marker.alpha);
        this.world.fillCircle(
          snapPixel(brick.x + brick.width - 7 + offsetX),
          snapPixel(brick.y + 7 + offsetY),
          2.5,
        );
      }

      if (typeof brick.hp === "number" && typeof brick.maxHp === "number" && brick.maxHp > 1) {
        const hpRatio = Math.max(0, Math.min(1, brick.hp / brick.maxHp));
        const hpBg = parseColor("rgba(255,255,255,0.2)", { value: 0xffffff, alpha: 0.2 });
        const hpFg = parseColor("rgba(255,235,160,0.9)", { value: 0xffeba0, alpha: 0.9 });
        this.world.fillStyle(hpBg.value, hpBg.alpha);
        this.world.fillRect(
          snapPixel(brick.x + 4 + offsetX),
          snapPixel(brick.y + brick.height - 4 + offsetY),
          brick.width - 8,
          2,
        );
        this.world.fillStyle(hpFg.value, hpFg.alpha);
        this.world.fillRect(
          snapPixel(brick.x + 4 + offsetX),
          snapPixel(brick.y + brick.height - 4 + offsetY),
          (brick.width - 8) * hpRatio,
          2,
        );
      }
    }

    const paddleFill = view.highContrast
      ? parseColor("#f5f8ff", { value: 0xf5f8ff, alpha: 1 })
      : parseColor("#44ccff", { value: 0x44ccff, alpha: 1 });
    const paddleStroke = view.highContrast
      ? parseColor("#ffffff", { value: 0xffffff, alpha: 1 })
      : parseColor("#d9f4ff", { value: 0xd9f4ff, alpha: 1 });
    const paddleX = snapPixel(view.paddle.x + offsetX);
    const paddleY = snapPixel(view.paddle.y + offsetY);
    this.world.fillStyle(paddleFill.value, 0.94);
    this.world.fillRoundedRect(paddleX, paddleY, view.paddle.width, view.paddle.height, 6);
    this.world.lineStyle(heavyLineWidth, paddleStroke.value, 0.94);
    this.world.strokeRoundedRect(paddleX, paddleY, view.paddle.width, view.paddle.height, 6);

    if (view.paddle.glowActive) {
      const glow = parseColor("rgba(120,220,255,0.28)", { value: 0x78dcff, alpha: 0.28 });
      this.world.fillStyle(glow.value, glow.alpha);
      this.world.fillRoundedRect(paddleX - 4, paddleY - 3, view.paddle.width + 8, view.paddle.height + 6, 8);
    }

    if (view.fluxFieldActive) {
      drawFluxField(this.world, view.paddle.x + offsetX, view.paddle.y + offsetY, view.paddle.width);
    }
    drawShield(this.world, view.shieldCharges, this.config.width, this.config.height, offsetX, offsetY);

    const trailColor = parseColor(theme.trail, { value: 0x99dcff, alpha: 0.26 });
    this.world.fillStyle(trailColor.value, trailColor.alpha);
    for (const trace of view.trail) {
      this.world.fillCircle(trace.x + offsetX, trace.y + offsetY, 2.4);
    }

    const ballFill = parseColor(theme.ballCore, { value: 0x4da5ff, alpha: 0.9 });
    const ballStroke = parseColor(theme.ballStroke, { value: 0xffffff, alpha: 0.9 });
    for (const ball of view.balls) {
      this.world.fillStyle(ballFill.value, ballFill.alpha);
      const ballX = snapPixel(ball.pos.x + offsetX);
      const ballY = snapPixel(ball.pos.y + offsetY);
      this.world.fillCircle(ballX, ballY, ball.radius);
      this.world.lineStyle(lineWidth, ballStroke.value, ballStroke.alpha);
      this.world.strokeCircle(ballX, ballY, ball.radius);
    }
    drawLaserProjectiles(this.world, view, offsetX, offsetY);

    drawEnemies(this.world, view, offsetX, offsetY);
    const visibleItemIds = drawFallingItems(this.world, view, offsetX, offsetY, lineWidth);
    this.syncFallingItemLabels(view, visibleItemIds, offsetX, offsetY);
    drawParticles(this.effects, view, offsetX, offsetY);
    drawImpactRings(this.effects, view, offsetX, offsetY);
    drawFloatingTexts(this.effects, view, offsetX, offsetY);

    if (view.flashMs > 0) {
      const flash = parseColor(theme.flash, { value: 0xff6464, alpha: 1 });
      const intensity = Math.min(1, view.flashMs / 180);
      this.overlay.fillStyle(flash.value, flash.alpha * intensity * 0.45);
      this.overlay.fillRect(0, 0, this.config.width, this.config.height);
    }

    if (view.showSceneOverlayTint) {
      const tint = parseColor(theme.overlayTint, { value: 0x000000, alpha: 0.2 });
      this.overlay.fillStyle(tint.value, tint.alpha);
      this.overlay.fillRect(0, 0, this.config.width, this.config.height);
    }
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

function drawProgressBar(
  graphics: Phaser.GameObjects.Graphics,
  progressRatio: number,
  width: number,
  color: string,
): void {
  const ratio = Math.max(0, Math.min(1, progressRatio));
  const base = parseColor("rgba(255,255,255,0.16)", { value: 0xffffff, alpha: 0.16 });
  const accent = parseColor(color, { value: 0x29d3ff, alpha: 0.9 });
  graphics.fillStyle(base.value, base.alpha);
  graphics.fillRect(20, 16, width - 40, 6);
  graphics.fillStyle(accent.value, accent.alpha);
  graphics.fillRect(20, 16, (width - 40) * ratio, 6);
}

function drawWarpZones(
  graphics: Phaser.GameObjects.Graphics,
  warpZones: RenderViewState["warpZones"],
  lineWidth: number,
): void {
  if (!warpZones || warpZones.length === 0) {
    return;
  }
  const fill = parseColor("rgba(120,214,255,0.14)", { value: 0x78d6ff, alpha: 0.14 });
  const stroke = parseColor("rgba(130,220,255,0.68)", { value: 0x82dcff, alpha: 0.68 });
  const guide = parseColor("rgba(125,220,255,0.42)", { value: 0x7ddcff, alpha: 0.42 });
  const exitFill = parseColor("rgba(255,206,102,0.85)", { value: 0xffce66, alpha: 0.85 });
  const exitRing = parseColor("rgba(255,238,176,0.9)", { value: 0xffeeb0, alpha: 0.9 });
  graphics.fillStyle(fill.value, fill.alpha);
  graphics.lineStyle(lineWidth, stroke.value, stroke.alpha);
  for (const zone of warpZones) {
    const width = Math.max(1, zone.inXMax - zone.inXMin);
    const height = Math.max(1, zone.inYMax - zone.inYMin);
    const entryX = snapPixel(zone.inXMin);
    const entryY = snapPixel(zone.inYMin);
    const entryCenterX = zone.inXMin + width / 2;
    const entryCenterY = zone.inYMin + height / 2;
    graphics.fillRect(entryX, entryY, width, height);
    graphics.strokeRect(entryX, entryY, width, height);
    drawGuideSegments(graphics, entryCenterX, entryCenterY, zone.outX, zone.outY, guide, lineWidth);
    graphics.fillStyle(exitFill.value, exitFill.alpha);
    graphics.fillCircle(snapPixel(zone.outX), snapPixel(zone.outY), 3.6);
    graphics.lineStyle(lineWidth, exitRing.value, exitRing.alpha);
    graphics.strokeCircle(snapPixel(zone.outX), snapPixel(zone.outY), 7.2);
  }
}

function drawShield(
  graphics: Phaser.GameObjects.Graphics,
  charges: number,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
): void {
  if (charges <= 0) {
    return;
  }
  const charge = parseColor("rgba(116,255,229,0.45)", { value: 0x74ffe5, alpha: 0.45 });
  graphics.fillStyle(charge.value, charge.alpha);
  graphics.fillRect(offsetX, height - 10 + offsetY, width, 10);
}

function drawFluxField(
  graphics: Phaser.GameObjects.Graphics,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
): void {
  const centerX = paddleX + paddleWidth / 2;
  const centerY = paddleY;
  const fill = parseColor("rgba(120, 170, 255, 0.08)", { value: 0x78aaff, alpha: 0.08 });
  const stroke = parseColor("rgba(160, 200, 255, 0.22)", { value: 0xa0c8ff, alpha: 0.22 });
  graphics.fillStyle(fill.value, fill.alpha);
  graphics.fillCircle(centerX, centerY, 180);
  graphics.lineStyle(1, stroke.value, stroke.alpha);
  graphics.strokeCircle(centerX, centerY, 180);
}

function drawLaserProjectiles(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  if (view.laserProjectiles.length <= 0) {
    return;
  }
  const core = parseColor("rgba(255, 110, 110, 0.92)", { value: 0xff6e6e, alpha: 0.92 });
  const glow = parseColor("rgba(255, 222, 222, 0.66)", { value: 0xffdede, alpha: 0.66 });
  graphics.lineStyle(2.1, core.value, core.alpha);
  for (const shot of view.laserProjectiles) {
    const x = snapPixel(shot.x + offsetX);
    const y = snapPixel(shot.y + offsetY);
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x, y - 12);
    graphics.strokePath();
    graphics.fillStyle(glow.value, glow.alpha);
    graphics.fillCircle(x, y - 12, 1.5);
  }
}

function drawEnemies(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  const enemyFill = parseColor("rgba(255,120,120,0.78)", { value: 0xff7878, alpha: 0.78 });
  const enemyStroke = parseColor("rgba(255,255,255,0.8)", { value: 0xffffff, alpha: 0.8 });
  for (const enemy of view.enemies) {
    if (!enemy.alive) {
      continue;
    }
    graphics.fillStyle(enemyFill.value, enemyFill.alpha);
    graphics.fillCircle(enemy.x + offsetX, enemy.y + offsetY, enemy.radius);
    graphics.lineStyle(1, enemyStroke.value, enemyStroke.alpha);
    graphics.strokeCircle(enemy.x + offsetX, enemy.y + offsetY, enemy.radius);
  }
}

function drawFallingItems(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  lineWidth: number,
): Set<number> {
  const visibleIds = new Set<number>();
  for (const item of view.fallingItems) {
    const itemColor = parseColor(getItemColor(item.type), { value: 0xdfe9ff, alpha: 0.95 });
    const itemStroke = parseColor("rgba(245, 252, 255, 0.88)", { value: 0xf5fcff, alpha: 0.88 });
    const x = snapPixel(item.pos.x - item.size / 2 + offsetX);
    const y = snapPixel(item.pos.y - item.size / 2 + offsetY);
    graphics.fillStyle(itemColor.value, itemColor.alpha);
    graphics.fillRoundedRect(x, y, item.size, item.size, 4);
    graphics.lineStyle(Math.max(1, lineWidth), itemStroke.value, itemStroke.alpha);
    graphics.strokeRoundedRect(x, y, item.size, item.size, 4);
    visibleIds.add(item.id);
  }
  return visibleIds;
}

function drawParticles(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  for (const particle of view.particles) {
    const ratio = particle.maxLifeMs > 0 ? Math.max(0, particle.lifeMs / particle.maxLifeMs) : 0;
    const color = parseColor(particle.color, { value: 0xffffff, alpha: 0.7 });
    graphics.fillStyle(color.value, color.alpha * ratio);
    graphics.fillCircle(particle.pos.x + offsetX, particle.pos.y + offsetY, Math.max(1, particle.size * 0.5));
  }
}

function drawImpactRings(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  for (const ring of view.impactRings) {
    const ratio = ring.maxLifeMs > 0 ? 1 - Math.max(0, ring.lifeMs / ring.maxLifeMs) : 0;
    const radius = ring.radiusStart + (ring.radiusEnd - ring.radiusStart) * ratio;
    const color = parseColor(ring.color, { value: 0xffffff, alpha: 0.75 });
    graphics.lineStyle(1.4, color.value, color.alpha * (1 - ratio * 0.6));
    graphics.strokeCircle(ring.pos.x + offsetX, ring.pos.y + offsetY, radius);
  }
}

function drawFloatingTexts(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  for (const text of view.floatingTexts) {
    const color = parseColor(text.color, { value: 0xffffff, alpha: 0.85 });
    const ratio = text.maxLifeMs > 0 ? Math.max(0, text.lifeMs / text.maxLifeMs) : 0;
    graphics.fillStyle(color.value, color.alpha * ratio);
    graphics.fillCircle(text.pos.x + offsetX, text.pos.y + offsetY, 1.8);
  }
}

function getBrickMarkerColor(kind: NonNullable<RenderViewState["bricks"][number]["kind"]>): string {
  switch (kind) {
    case "durable":
      return "#ffd06e";
    case "armored":
      return "#b9daff";
    case "regen":
      return "#8affae";
    case "hazard":
      return "#ff8f8f";
    case "boss":
      return "#ff73d0";
    default:
      return "#ffffff";
  }
}

function resolveBackdropTheme(
  themeBandId: RenderViewState["themeBandId"],
  highContrast: boolean,
): BackdropTheme {
  if (highContrast) {
    return {
      base: "#000000",
      top: "#111111",
      frame: "#f5e76a",
    };
  }
  return BACKDROP_BY_BAND[themeBandId] ?? BACKDROP_BY_BAND.early;
}

function drawGuideSegments(
  graphics: Phaser.GameObjects.Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: ParsedColor,
  lineWidth: number,
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) {
    return;
  }
  const unitX = dx / distance;
  const unitY = dy / distance;
  const dashLength = 8;
  const gapLength = 5;
  let cursor = 0;
  graphics.lineStyle(lineWidth, color.value, color.alpha);
  while (cursor < distance) {
    const start = cursor;
    const end = Math.min(distance, cursor + dashLength);
    graphics.beginPath();
    graphics.moveTo(snapPixel(fromX + unitX * start), snapPixel(fromY + unitY * start));
    graphics.lineTo(snapPixel(fromX + unitX * end), snapPixel(fromY + unitY * end));
    graphics.strokePath();
    cursor += dashLength + gapLength;
  }
}

function readDevicePixelRatio(scene: Phaser.Scene): number {
  const ratio = scene.game.canvas.ownerDocument?.defaultView?.devicePixelRatio ?? 1;
  return Math.max(1, Math.min(2, ratio));
}

function snapPixel(value: number): number {
  return Math.round(value) + 0.5;
}

function parseColor(input: string, fallback: ParsedColor): ParsedColor {
  if (input.startsWith("#")) {
    const normalized = normalizeHex(input);
    if (!normalized) {
      return fallback;
    }
    return {
      value: Number.parseInt(normalized, 16),
      alpha: 1,
    };
  }

  const rgba = input.match(
    /^rgba?\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)(?:\s*,\s*([0-9]+(?:\.[0-9]+)?))?\s*\)$/i,
  );
  if (!rgba) {
    return fallback;
  }

  const r = clampColorChannel(Number.parseFloat(rgba[1]));
  const g = clampColorChannel(Number.parseFloat(rgba[2]));
  const b = clampColorChannel(Number.parseFloat(rgba[3]));
  const alpha = rgba[4] ? Math.max(0, Math.min(1, Number.parseFloat(rgba[4]))) : 1;
  return {
    value: (r << 16) | (g << 8) | b,
    alpha,
  };
}

function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeHex(value: string): string | null {
  const text = value.trim().replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(text)) {
    return text;
  }
  if (/^[0-9a-fA-F]{3}$/.test(text)) {
    return `${text[0]}${text[0]}${text[1]}${text[1]}${text[2]}${text[2]}`;
  }
  return null;
}
