import type Phaser from "phaser";
import type { RenderViewState } from "../../../game/renderTypes";
import { parseColor } from "../color";

export function drawEffectsLayer(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  drawParticles(graphics, view, offsetX, offsetY);
  drawImpactRings(graphics, view, offsetX, offsetY);
  drawFloatingTexts(graphics, view, offsetX, offsetY);
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
