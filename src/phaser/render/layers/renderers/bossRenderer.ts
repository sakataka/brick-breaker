import type { RenderViewState } from "../../../../game/renderTypes";
import { parseColor } from "../../color";
import type { WorldGraphics } from "./types";

export function drawEnemies(
  graphics: WorldGraphics,
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

export function drawBossTelegraph(
  graphics: WorldGraphics,
  view: RenderViewState,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
): void {
  if (view.bossSweep) {
    drawSweepLane(
      graphics,
      view.bossSweep.lane,
      width,
      height,
      offsetX,
      offsetY,
      view.bossSweep.progress,
      true,
    );
  }
  if (!view.bossTelegraph) {
    return;
  }
  if (view.bossTelegraph.kind === "sweep" && view.bossTelegraph.lane) {
    drawSweepLane(
      graphics,
      view.bossTelegraph.lane,
      width,
      height,
      offsetX,
      offsetY,
      view.bossTelegraph.progress,
      false,
    );
    return;
  }
  if (
    (view.bossTelegraph.kind === "volley" || view.bossTelegraph.kind === "burst") &&
    typeof view.bossTelegraph.targetX === "number"
  ) {
    const telegraph = parseColor("rgba(255, 196, 124, 0.55)", { value: 0xffc47c, alpha: 0.55 });
    graphics.lineStyle(2, telegraph.value, telegraph.alpha);
    const sources = view.bricks.filter((brick) => brick.alive && brick.kind === "boss");
    const boss = sources[0];
    if (!boss) {
      return;
    }
    const centerX = boss.x + boss.width / 2 + offsetX;
    const originY = boss.y + boss.height + 12 + offsetY;
    const targetXs =
      typeof view.bossTelegraph.spread === "number" && view.bossTelegraph.spread > 0
        ? [
            view.bossTelegraph.targetX - view.bossTelegraph.spread,
            view.bossTelegraph.targetX,
            view.bossTelegraph.targetX + view.bossTelegraph.spread,
          ]
        : [view.bossTelegraph.targetX];
    for (const targetX of targetXs) {
      graphics.beginPath();
      graphics.moveTo(centerX, originY);
      graphics.lineTo(targetX + offsetX, height - 120 + offsetY);
      graphics.strokePath();
    }
  }
}

function drawSweepLane(
  graphics: WorldGraphics,
  lane: NonNullable<RenderViewState["bossSweep"]>["lane"],
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  progress: number,
  active: boolean,
): void {
  const laneWidth = width / 3;
  const laneIndex = lane === "left" ? 0 : lane === "center" ? 1 : 2;
  const fill = parseColor(active ? "rgba(255, 98, 98, 0.22)" : "rgba(255, 190, 120, 0.14)", {
    value: active ? 0xff6262 : 0xffbe78,
    alpha: active ? 0.22 : 0.14,
  });
  const stroke = parseColor(active ? "rgba(255, 138, 138, 0.6)" : "rgba(255, 214, 148, 0.55)", {
    value: active ? 0xff8a8a : 0xffd694,
    alpha: active ? 0.6 : 0.55,
  });
  const x = laneIndex * laneWidth + offsetX;
  const y = height - 98 + offsetY;
  graphics.fillStyle(fill.value, fill.alpha + progress * 0.06);
  graphics.fillRect(x, y, laneWidth, 92);
  graphics.lineStyle(1.6, stroke.value, stroke.alpha);
  graphics.strokeRect(x + 1, y + 1, laneWidth - 2, 90);
}
