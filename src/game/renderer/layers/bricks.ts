import type { Brick } from "../../types";
import type { RenderTheme } from "../theme";

export function drawBricks(
  ctx: CanvasRenderingContext2D,
  bricks: Brick[],
  theme: RenderTheme,
  highContrast = false,
): void {
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }

    const glass = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    glass.addColorStop(0, brick.color ?? "rgba(255, 180, 120, 0.35)");
    glass.addColorStop(1, theme.brickGlow);

    ctx.fillStyle = glass;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.strokeStyle = theme.brickStroke;
    ctx.lineWidth = highContrast ? 2 : 1;
    ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    drawEliteMarks(ctx, brick, highContrast);
    if (highContrast) {
      drawHighContrastGlyph(ctx, brick);
    }
  }
  ctx.lineWidth = 1;
}

function drawEliteMarks(ctx: CanvasRenderingContext2D, brick: Brick, highContrast: boolean): void {
  if (brick.kind === "durable") {
    ctx.strokeStyle = "rgba(255, 233, 142, 0.92)";
    ctx.lineWidth = highContrast ? 2.4 : 1.8;
    ctx.strokeRect(brick.x + 1.5, brick.y + 1.5, brick.width - 3, brick.height - 3);
  } else if (brick.kind === "armored") {
    ctx.strokeStyle = "rgba(196, 248, 255, 0.94)";
    ctx.lineWidth = highContrast ? 2.8 : 2;
    ctx.strokeRect(brick.x + 1.5, brick.y + 1.5, brick.width - 3, brick.height - 3);
    ctx.beginPath();
    ctx.moveTo(brick.x + 4, brick.y + 4);
    ctx.lineTo(brick.x + brick.width - 4, brick.y + brick.height - 4);
    ctx.moveTo(brick.x + brick.width - 4, brick.y + 4);
    ctx.lineTo(brick.x + 4, brick.y + brick.height - 4);
    ctx.stroke();
  }

  const hp = brick.hp ?? 1;
  if (hp > 1) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "700 10px Avenir Next";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(hp), brick.x + brick.width / 2, brick.y + brick.height / 2);
  }
  ctx.lineWidth = 1;
}

function drawHighContrastGlyph(ctx: CanvasRenderingContext2D, brick: Brick): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "700 9px Avenir Next";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const marker = brick.kind === "durable" ? "D" : brick.kind === "armored" ? "A" : "N";
  ctx.fillText(marker, brick.x + 3, brick.y + 2);
}
