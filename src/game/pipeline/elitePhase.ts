import type { CollisionEvent, GameConfig, GameState, RandomSource } from "../types";

const ENEMY_WAVE_CAP = 4;
const THORNS_PENALTY_SCORE = 40;
const THORNS_SPEED_BOOST_SEC = 1.6;

export function processEliteBrickEvents(
  state: GameState,
  events: CollisionEvent[],
  config: Pick<GameConfig, "width">,
  random: RandomSource,
): { scorePenalty: number } {
  let scorePenalty = 0;
  for (const event of events) {
    if (event.kind !== "brick") {
      continue;
    }
    switch (event.brickKind) {
      case "split":
        spawnSplitChildren(state, event, config);
        break;
      case "summon":
        spawnSummonedEnemy(state, event, random);
        break;
      case "thorns":
        applyThornsRetaliation(state);
        scorePenalty += THORNS_PENALTY_SCORE;
        break;
      default:
        break;
    }
  }
  return { scorePenalty };
}

function spawnSplitChildren(
  state: GameState,
  event: CollisionEvent,
  config: Pick<GameConfig, "width">,
): void {
  const source = resolveSplitSourceBrick(state, event);
  if (!source) {
    return;
  }
  const childWidth = Math.max(18, source.width * 0.58);
  const childHeight = source.height;
  const childY = source.y;
  const centerX = source.x + source.width / 2;
  const gap = 5;

  const candidateXs = [centerX - childWidth - gap / 2, centerX + gap / 2];
  let spawned = 0;
  for (const x of candidateXs) {
    if (x < 0 || x + childWidth > config.width) {
      continue;
    }
    state.bricks.push({
      id: nextBrickId(state),
      x,
      y: childY,
      width: childWidth,
      height: childHeight,
      alive: true,
      kind: "normal",
      hp: 1,
      maxHp: 1,
      regenCharges: 0,
      color: source.color,
    });
    spawned += 1;
  }
  if (spawned <= 0) {
    return;
  }
  state.vfx.floatingTexts.push({
    text: "SPLIT!",
    pos: { x: centerX, y: childY + childHeight / 2 },
    lifeMs: 420,
    maxLifeMs: 420,
    color: "rgba(255, 244, 182, 0.95)",
  });
}

function resolveSplitSourceBrick(
  state: GameState,
  event: CollisionEvent,
): GameState["bricks"][number] | null {
  if (typeof event.brickId === "number") {
    const byId = state.bricks.find((brick) => brick.id === event.brickId);
    if (byId) {
      return byId;
    }
  }
  let best: GameState["bricks"][number] | null = null;
  let bestDistanceSq = Number.POSITIVE_INFINITY;
  for (const brick of state.bricks) {
    if (brick.alive || brick.kind !== "split") {
      continue;
    }
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const dx = cx - event.x;
    const dy = cy - event.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < bestDistanceSq) {
      bestDistanceSq = distanceSq;
      best = brick;
    }
  }
  return best;
}

function spawnSummonedEnemy(state: GameState, event: CollisionEvent, random: RandomSource): void {
  if (state.enemies.length >= ENEMY_WAVE_CAP) {
    return;
  }
  const nextId = state.enemies.reduce((max, enemy) => Math.max(max, enemy.id), 0) + 1;
  const direction = random.next() > 0.5 ? 1 : -1;
  state.enemies.push({
    id: nextId,
    x: event.x,
    y: event.y + 24,
    vx: direction * (92 + random.next() * 48),
    radius: 10,
    alive: true,
  });
  state.vfx.floatingTexts.push({
    text: "SUMMON",
    pos: { x: event.x, y: event.y + 20 },
    lifeMs: 360,
    maxLifeMs: 360,
    color: "rgba(255, 176, 124, 0.95)",
  });
}

function applyThornsRetaliation(state: GameState): void {
  state.hazard.speedBoostUntilSec = Math.max(
    state.hazard.speedBoostUntilSec,
    state.elapsedSec + THORNS_SPEED_BOOST_SEC,
  );
  state.vfx.flashMs = Math.max(state.vfx.flashMs, 70);
  state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 55);
  state.vfx.shakePx = Math.max(state.vfx.shakePx, 2);
  state.vfx.floatingTexts.push({
    text: "THORNS!",
    pos: { x: state.paddle.x + state.paddle.width / 2, y: state.paddle.y - 16 },
    lifeMs: 320,
    maxLifeMs: 320,
    color: "rgba(255, 140, 140, 0.94)",
  });
}

function nextBrickId(state: GameState): number {
  return state.bricks.reduce((max, brick) => Math.max(max, brick.id), 0) + 1;
}
