import type { FloatingText, GameConfig, ImpactRing, Particle } from "../../types";
import type { RenderTheme } from "../theme";
import { withAlpha } from "./utils";

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.lifeMs / particle.maxLifeMs);
    ctx.fillStyle = withAlpha(particle.color, alpha);
    ctx.beginPath();
    ctx.arc(particle.pos.x, particle.pos.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawImpactRings(ctx: CanvasRenderingContext2D, rings: ImpactRing[]): void {
  for (const ring of rings) {
    const ratio = Math.max(0, ring.lifeMs / ring.maxLifeMs);
    const radius = ring.radiusEnd - (ring.radiusEnd - ring.radiusStart) * ratio;
    ctx.strokeStyle = withAlpha(ring.color, Math.min(1, ratio * 0.9));
    ctx.lineWidth = 1 + ratio * 2.4;
    ctx.beginPath();
    ctx.arc(ring.pos.x, ring.pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, labels: FloatingText[]): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 13px Avenir Next";

  for (const label of labels) {
    const ratio = Math.max(0, label.lifeMs / label.maxLifeMs);
    ctx.fillStyle = withAlpha(label.color, Math.min(1, ratio));
    ctx.fillText(label.text, label.pos.x, label.pos.y);
  }
}

export function drawFlash(
  ctx: CanvasRenderingContext2D,
  config: GameConfig,
  flashMs: number,
  theme: RenderTheme,
): void {
  if (flashMs <= 0) {
    return;
  }

  const alpha = Math.min(0.28, (flashMs / 180) * 0.28);
  ctx.fillStyle = withAlpha(theme.flash, alpha);
  ctx.fillRect(0, 0, config.width, config.height);
}
