import { getDefaultBrickHp } from "../brickDamage";
import { isGeneratorRespawnTarget } from "../brickRules";
import { STAGE_CONTROL_CONFIG } from "../config";
import type { Brick, GameState } from "../types";

export function updateStageControlBricks(state: GameState, generatorActive: boolean, deltaSec: number): void {
  if (!generatorActive) {
    return;
  }
  for (const brick of state.bricks) {
    if (!brick.alive || brick.kind !== "generator") {
      continue;
    }
    brick.cooldownSec = Math.max(0, (brick.cooldownSec ?? 0) - deltaSec);
    if ((brick.cooldownSec ?? 0) > 0) {
      continue;
    }
    const target = findGeneratorTarget(state.bricks, brick);
    brick.cooldownSec = STAGE_CONTROL_CONFIG.generatorRespawnIntervalSec;
    if (!target) {
      continue;
    }
    target.alive = true;
    target.hp = getDefaultBrickHp(target);
    target.maxHp = getDefaultBrickHp(target);
    state.vfx.floatingTexts.push({
      key: "generator",
      pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
      lifeMs: 360,
      maxLifeMs: 360,
      color: "rgba(132, 255, 196, 0.95)",
    });
    state.vfx.impactRings.push({
      pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
      radiusStart: 4,
      radiusEnd: 24,
      lifeMs: 200,
      maxLifeMs: 200,
      color: "rgba(132, 255, 196, 0.82)",
    });
  }
}

function findGeneratorTarget(bricks: Brick[], generator: Brick): Brick | null {
  const generatorRow = generator.row ?? -99;
  const generatorCol = generator.col ?? -99;
  const inRange = bricks
    .filter(
      (brick) =>
        !brick.alive &&
        isGeneratorRespawnTarget(brick) &&
        typeof brick.row === "number" &&
        typeof brick.col === "number" &&
        Math.abs(brick.row - generatorRow) <= STAGE_CONTROL_CONFIG.generatorRespawnRange &&
        Math.abs(brick.col - generatorCol) <= STAGE_CONTROL_CONFIG.generatorRespawnRange,
    )
    .sort((a, b) => {
      const aDistance = Math.abs((a.row ?? 0) - generatorRow) + Math.abs((a.col ?? 0) - generatorCol);
      const bDistance = Math.abs((b.row ?? 0) - generatorRow) + Math.abs((b.col ?? 0) - generatorCol);
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }
      return (a.id ?? 0) - (b.id ?? 0);
    });
  return inRange[0] ?? null;
}
