import { getPublicEncounterCatalog, type PublicEncounterDefinition } from "../content";
import type { GameConfig, GameState, PublicThreatTier, Scene } from "../public/types";

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
  const rows = encounter.climax === "boss" || encounter.climax === "tier2_boss" ? 3 : 5;
  const cols = encounter.climax === "boss" || encounter.climax === "tier2_boss" ? 7 : 10;
  const marginX = 88;
  const topY = 92;
  const gap = 8;
  const width = (config.width - marginX * 2 - gap * (cols - 1)) / cols;
  const height = 28;
  const bricks = [];
  let id = 1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const stageNumber = encounter.stageNumber;
      let kind:
        | PublicEncounterDefinition["climax"]
        | "normal"
        | "steel"
        | "generator"
        | "gate"
        | "turret" = "normal";
      if (encounter.climax === "boss" && row === 0 && col >= 2 && col <= 4) {
        kind = "boss";
      } else if (encounter.climax === "tier2_boss" && row <= 1 && col >= 2 && col <= 4) {
        kind = "boss";
      } else if (stageNumber === 6 && col === 0) {
        kind = "gate";
      } else if (stageNumber === 7 && row === 1 && (col === 1 || col === cols - 2)) {
        kind = "turret";
      } else if (stageNumber === 10 && row === 0 && col % 3 === 0) {
        kind = "steel";
      } else if (stageNumber === 11 && row === 2 && col === Math.floor(cols / 2)) {
        kind = "generator";
      }
      bricks.push({
        id: id++,
        x: marginX + col * (width + gap),
        y: topY + row * (height + gap),
        width,
        height,
        alive: true,
        row,
        kind,
        hp: kind === "boss" ? 10 : kind === "steel" ? 999 : 1,
        maxHp: kind === "boss" ? 10 : kind === "steel" ? 999 : 1,
      });
    }
  }
  return bricks;
}

export function createEncounterState(encounter: PublicEncounterDefinition): GameState["encounter"] {
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
    modifierKey: getStageModifier(encounter.stageNumber).key,
    shop: {
      purchased: false,
      lastOffer: null,
    },
    boss:
      encounter.climax === "boss" ||
      encounter.climax === "midboss" ||
      encounter.climax === "tier2_boss"
        ? {
            hp: encounter.climax === "tier2_boss" ? 16 : 10,
            maxHp: encounter.climax === "tier2_boss" ? 16 : 10,
            phase: 1,
            telegraphProgress: 0,
            attackProgress: 0,
            punishProgress: 0,
            shotProfile: encounter.climax === "tier2_boss" ? "void_core" : "plasma_bolt",
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

export function getStageModifier(stageNumber: number) {
  if (stageNumber === 6) {
    return {
      key: "warp_zone" as const,
      warpZones: [
        {
          inXMin: 100,
          inXMax: 170,
          inYMin: 130,
          inYMax: 260,
          outX: 790,
          outY: 160,
        },
        {
          inXMin: 760,
          inXMax: 840,
          inYMin: 130,
          inYMax: 260,
          outX: 160,
          outY: 160,
        },
      ],
    };
  }
  if (stageNumber === 8) {
    return { key: "speed_ball" as const };
  }
  if (stageNumber === 9 || stageNumber === 10) {
    return { key: "enemy_flux" as const };
  }
  if (stageNumber === 11) {
    return { key: "flux" as const };
  }
  return { key: undefined };
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
