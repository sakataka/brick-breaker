import type Phaser from "phaser";
import { THEME_BANDS } from "../../game/config";
import { DEFAULT_RENDER_THEME, resolveRenderTheme } from "../../game/renderer/theme";
import type { RenderViewState } from "../../game/renderTypes";
import type { GameConfig, ItemType } from "../../game/types";

interface ParsedColor {
  value: number;
  alpha: number;
}

const ITEM_COLOR_BY_TYPE: Record<ItemType, string> = {
  paddle_plus: "#8fd4ff",
  slow_ball: "#6fc3a4",
  multiball: "#d2a3ff",
  shield: "#85f2da",
  pierce: "#ffd36b",
  bomb: "#ff7f7f",
};

export class PhaserRenderPort {
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private readonly world: Phaser.GameObjects.Graphics;
  private readonly effects: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;

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

    this.backdrop.clear();
    this.world.clear();
    this.effects.clear();
    this.overlay.clear();

    const background = parseColor(theme.backdropEnd, { value: 0x0b1020, alpha: 1 });
    this.backdrop.fillStyle(background.value, background.alpha);
    this.backdrop.fillRect(0, 0, this.config.width, this.config.height);

    const header = parseColor(theme.backdropStart, { value: 0x161d30, alpha: 0.5 });
    this.backdrop.fillStyle(header.value, header.alpha);
    this.backdrop.fillRect(0, 0, this.config.width, 72);

    drawProgressBar(this.backdrop, view.progressRatio, this.config.width, theme.progressBar);
    drawWarpZones(this.backdrop, view.warpZones);

    for (const brick of view.bricks) {
      if (!brick.alive) {
        continue;
      }
      const fallbackColor = band.brickPalette[(brick.row ?? 0) % band.brickPalette.length] ?? "#ffffff";
      const body = parseColor(brick.color ?? fallbackColor, { value: 0xa0c8ff, alpha: 0.55 });
      const stroke = parseColor(theme.brickStroke, { value: 0xffffff, alpha: 0.75 });
      this.world.fillStyle(body.value, body.alpha);
      this.world.fillRoundedRect(brick.x + offsetX, brick.y + offsetY, brick.width, brick.height, 5);
      this.world.lineStyle(1.2, stroke.value, stroke.alpha);
      this.world.strokeRoundedRect(brick.x + offsetX, brick.y + offsetY, brick.width, brick.height, 5);

      if (brick.kind && brick.kind !== "normal") {
        const markerColor = getBrickMarkerColor(brick.kind);
        const marker = parseColor(markerColor, { value: 0xffffff, alpha: 0.95 });
        this.world.fillStyle(marker.value, marker.alpha);
        this.world.fillCircle(brick.x + brick.width - 7 + offsetX, brick.y + 7 + offsetY, 2.5);
      }

      if (typeof brick.hp === "number" && typeof brick.maxHp === "number" && brick.maxHp > 1) {
        const hpRatio = Math.max(0, Math.min(1, brick.hp / brick.maxHp));
        const hpBg = parseColor("rgba(255,255,255,0.2)", { value: 0xffffff, alpha: 0.2 });
        const hpFg = parseColor("rgba(255,235,160,0.9)", { value: 0xffeba0, alpha: 0.9 });
        this.world.fillStyle(hpBg.value, hpBg.alpha);
        this.world.fillRect(brick.x + 4 + offsetX, brick.y + brick.height - 4 + offsetY, brick.width - 8, 2);
        this.world.fillStyle(hpFg.value, hpFg.alpha);
        this.world.fillRect(
          brick.x + 4 + offsetX,
          brick.y + brick.height - 4 + offsetY,
          (brick.width - 8) * hpRatio,
          2,
        );
      }
    }

    const paddleFill = parseColor(theme.paddleStart, { value: 0xffffff, alpha: 0.9 });
    this.world.fillStyle(paddleFill.value, paddleFill.alpha);
    this.world.fillRoundedRect(
      view.paddle.x + offsetX,
      view.paddle.y + offsetY,
      view.paddle.width,
      view.paddle.height,
      6,
    );

    if (view.paddle.glowActive) {
      const glow = parseColor("rgba(120,220,255,0.28)", { value: 0x78dcff, alpha: 0.28 });
      this.world.fillStyle(glow.value, glow.alpha);
      this.world.fillRoundedRect(
        view.paddle.x - 4 + offsetX,
        view.paddle.y - 3 + offsetY,
        view.paddle.width + 8,
        view.paddle.height + 6,
        8,
      );
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
      this.world.fillCircle(ball.pos.x + offsetX, ball.pos.y + offsetY, ball.radius);
      this.world.lineStyle(1.2, ballStroke.value, ballStroke.alpha);
      this.world.strokeCircle(ball.pos.x + offsetX, ball.pos.y + offsetY, ball.radius);
    }

    drawEnemies(this.world, view, offsetX, offsetY);
    drawFallingItems(this.world, view, offsetX, offsetY);
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
    this.backdrop.destroy();
    this.world.destroy();
    this.effects.destroy();
    this.overlay.destroy();
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

function drawWarpZones(graphics: Phaser.GameObjects.Graphics, warpZones: RenderViewState["warpZones"]): void {
  if (!warpZones || warpZones.length === 0) {
    return;
  }
  const stroke = parseColor("rgba(130,220,255,0.52)", { value: 0x82dcff, alpha: 0.52 });
  graphics.lineStyle(1.1, stroke.value, stroke.alpha);
  for (const zone of warpZones) {
    graphics.strokeRect(
      zone.inXMin,
      zone.inYMin,
      Math.max(1, zone.inXMax - zone.inXMin),
      Math.max(1, zone.inYMax - zone.inYMin),
    );
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
): void {
  for (const item of view.fallingItems) {
    const itemColor = parseColor(ITEM_COLOR_BY_TYPE[item.type], { value: 0xdfe9ff, alpha: 0.95 });
    graphics.fillStyle(itemColor.value, itemColor.alpha);
    graphics.fillRoundedRect(
      item.pos.x - item.size / 2 + offsetX,
      item.pos.y - item.size / 2 + offsetY,
      item.size,
      item.size,
      4,
    );
  }
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
