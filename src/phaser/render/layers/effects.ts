import type Phaser from "phaser";
import type { RenderViewState } from "../../../game/renderTypes";
import { parseColor } from "../color";
import { snapByStep } from "../dpiProfile";

interface EffectsRenderOptions {
  lineWidth: number;
  snapStep: number;
}

export function drawEffectsLayer(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  options: EffectsRenderOptions,
): void {
  drawParticles(graphics, view, offsetX, offsetY, options);
  drawImpactRings(graphics, view, offsetX, offsetY, options);
  drawFloatingTexts(graphics, view, offsetX, offsetY, options);
}

function drawParticles(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  options: EffectsRenderOptions,
): void {
  for (const particle of view.particles) {
    const ratio = particle.maxLifeMs > 0 ? Math.max(0, particle.lifeMs / particle.maxLifeMs) : 0;
    const color = parseColor(particle.color, { value: 0xffffff, alpha: 0.7 });
    graphics.fillStyle(color.value, color.alpha * ratio);
    graphics.fillCircle(
      snapByStep(particle.pos.x + offsetX, options.snapStep),
      snapByStep(particle.pos.y + offsetY, options.snapStep),
      Math.max(1, particle.size * 0.5),
    );
  }
}

function drawImpactRings(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  options: EffectsRenderOptions,
): void {
  for (const ring of view.impactRings) {
    const ratio = ring.maxLifeMs > 0 ? 1 - Math.max(0, ring.lifeMs / ring.maxLifeMs) : 0;
    const radius = ring.radiusStart + (ring.radiusEnd - ring.radiusStart) * ratio;
    const color = parseColor(ring.color, { value: 0xffffff, alpha: 0.75 });
    graphics.lineStyle(Math.max(options.lineWidth, 1), color.value, color.alpha * (1 - ratio * 0.6));
    graphics.strokeCircle(
      snapByStep(ring.pos.x + offsetX, options.snapStep),
      snapByStep(ring.pos.y + offsetY, options.snapStep),
      radius,
    );
  }
}

function drawFloatingTexts(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  options: EffectsRenderOptions,
): void {
  for (const text of view.floatingTexts) {
    const color = parseColor(text.color, { value: 0xffffff, alpha: 0.85 });
    const ratio = text.maxLifeMs > 0 ? Math.max(0, text.lifeMs / text.maxLifeMs) : 0;
    graphics.fillStyle(color.value, color.alpha * ratio);
    graphics.fillCircle(
      snapByStep(text.pos.x + offsetX, options.snapStep),
      snapByStep(text.pos.y + offsetY, options.snapStep),
      Math.max(1.5, options.lineWidth + 0.4),
    );
  }
}
