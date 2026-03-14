import type { Brick, BrickKind } from "./types";

export function getInitialBrickHp(kind: BrickKind): number {
  switch (kind) {
    case "boss":
      return 18;
    case "turret":
      return 2;
    case "durable":
    case "armored":
    case "regen":
    case "generator":
      return 2;
    case "gate":
    case "steel":
      return Number.POSITIVE_INFINITY;
    default:
      return 1;
  }
}

export function isIndestructibleBrick(brick: Pick<Brick, "kind">): boolean {
  return (brick.kind ?? "normal") === "steel" || (brick.kind ?? "normal") === "gate";
}

export function countsTowardStageClear(brick: Pick<Brick, "kind">): boolean {
  const kind = brick.kind ?? "normal";
  return kind !== "steel" && kind !== "gate";
}

export function countAliveObjectiveBricks(
  bricks: readonly Pick<Brick, "alive" | "kind">[],
): number {
  return bricks.reduce(
    (count, brick) => count + (brick.alive && countsTowardStageClear(brick) ? 1 : 0),
    0,
  );
}

export function isGeneratorRespawnTarget(brick: Pick<Brick, "kind">): boolean {
  return (brick.kind ?? "normal") === "normal";
}
