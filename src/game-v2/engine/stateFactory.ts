import { getPublicEncounterCatalog, type PublicEncounterDefinition } from "../content";
import {
  getStageBlueprint,
  getStageModifierDefinition,
  matchesSpecialBrickRule,
} from "../content/stageBlueprints";
import type { BrickKind, GameConfig, GameState, PublicThreatTier, Scene } from "../public/types";

function createPaddle(config: GameConfig) {
  const width = config.difficulty === "casual" ? 148 : config.difficulty === "hard" ? 118 : 132;
  return {
    x: config.width / 2 - width / 2,
    y: config.height - 44,
    width,
    height: 16,
  };
}

function createEncounterBricks(config: GameConfig, encounter: PublicEncounterDefinition) {
  const blueprint = getStageBlueprint(encounter.threatTier, encounter.stageNumber);
  const { rows, cols, marginX, topY, gap, brickHeight } = blueprint.layout;
  const width = (config.width - marginX * 2 - gap * (cols - 1)) / cols;
  const bricks = [];
  let id = 1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const rule = blueprint.specialBricks.find((candidate) =>
        matchesSpecialBrickRule(candidate, row, col, cols),
      );
      const kind: BrickKind = rule?.kind ?? "normal";
      const hp = rule?.hp ?? (kind === "steel" ? 999 : 1);
      bricks.push({
        id: id++,
        x: marginX + col * (width + gap),
        y: topY + row * (brickHeight + gap),
        width,
        height: brickHeight,
        alive: true,
        row,
        kind,
        hp,
        maxHp: rule?.maxHp ?? hp,
      });
    }
  }
  return bricks;
}

export function createEncounterState(encounter: PublicEncounterDefinition): GameState["encounter"] {
  const blueprint = getStageBlueprint(encounter.threatTier, encounter.stageNumber);
  return {
    id: encounter.id,
    stageNumber: encounter.stageNumber,
    label: encounter.label,
    elapsedSec: 0,
    scoreFocus: encounter.scoreFocus,
    previewTags: encounter.previewTags,
    threatLevel: encounter.threatLevel,
    themeId: encounter.visualTheme,
    climax: encounter.climax,
    objective: encounter.objective,
    modifierKey: getStageModifier(encounter.threatTier, encounter.stageNumber).key,
    shop: {
      purchased: false,
      lastOffer: null,
    },
    boss:
      encounter.climax === "boss" ||
      encounter.climax === "midboss" ||
      encounter.climax === "tier2_boss"
        ? {
            hp: blueprint.boss?.hp ?? 10,
            maxHp: blueprint.boss?.maxHp ?? 10,
            phase: 1,
            telegraphProgress: 0,
            attackProgress: 0,
            punishProgress: 0,
            shotProfile: blueprint.boss?.shotProfile ?? "plasma_bolt",
          }
        : null,
  };
}

export function createCombatState(
  config: GameConfig,
  encounter: PublicEncounterDefinition,
): GameState["combat"] {
  const paddle = createPaddle(config);
  const ballSpeed = config.initialBallSpeed;
  return {
    paddle,
    balls: [
      {
        id: 1,
        pos: { x: config.width / 2, y: paddle.y - 18 },
        vel: { x: ballSpeed * 0.5, y: -ballSpeed * 0.8 },
        radius: 8,
        speed: ballSpeed,
      },
    ],
    activeSkill: {
      cooldownSec: 6,
      remainingCooldownSec: 0,
    },
    bricks: createEncounterBricks(config, encounter),
    trail: [],
    particles: [],
    impactRings: [],
    floatingTexts: [],
    fallingItems: [],
    enemies: [],
    laserProjectiles: [],
    bossProjectiles: [],
    flashMs: 0,
  };
}

export function getStageModifier(threatTier: PublicThreatTier, stageNumber: number) {
  const modifier = getStageModifierDefinition(threatTier, stageNumber);
  return {
    key: modifier.key,
    warpZones: modifier.warpZones ? [...modifier.warpZones] : undefined,
  };
}

export function createInitialGameState(
  config: GameConfig,
  reducedMotion: boolean,
  scene: Scene,
  highContrast = false,
  threatTier: PublicThreatTier = 1,
): GameState {
  const encounters = getPublicEncounterCatalog(threatTier);
  const encounter = encounters[0];
  return {
    scene,
    run: {
      threatTier,
      progress: {
        currentEncounterIndex: 0,
        totalEncounters: encounters.length,
        currentStageNumber: encounter.stageNumber,
      },
      score: 1800,
      lives: config.initialLives,
      elapsedSec: 0,
      comboMultiplier: 1,
      comboWindowSec: 1.8,
      comboWindowRemainingSec: 0,
      activeItems: [],
      record: {
        currentRunRecord: false,
        deltaToBest: 0,
        courseBestScore: 0,
      },
      stageResults: [],
    },
    encounter: createEncounterState(encounter),
    combat: createCombatState(config, encounter),
    ui: {
      a11y: {
        reducedMotion,
        highContrast,
      },
      warningLevel: "calm",
    },
  };
}
