export interface BgmStep {
  leadMidi?: number;
  bassMidi?: number;
  leadGain?: number;
  bassGain?: number;
}

export interface BgmTrack {
  id: string;
  theme: string;
  tempo: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  steps: readonly BgmStep[];
}

const NEON_SCALE = [0, 2, 3, 5, 7, 10] as const;
const ARCADE_SCALE = [0, 2, 4, 7, 9, 11] as const;
const CHASE_SCALE = [0, 1, 3, 5, 6, 8, 10] as const;
const FINAL_SCALE = [0, 2, 3, 5, 7, 8, 11] as const;
const TITLE_ROOT = 57;
const STAGE_COUNT = 12;
const BARS = 8;
const STEPS_PER_BAR = 4;
const STEP_COUNT = BARS * STEPS_PER_BAR;
const RHYTHM_LENGTH = 8;

interface ThemeDefinition {
  id: "neon" | "arcade" | "chase" | "final";
  title: string;
  rootBase: number;
  scale: readonly number[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  leadPattern: readonly number[];
  bassPattern: readonly number[];
  tempoRange: { min: number; max: number };
}

const THEMES: readonly ThemeDefinition[] = [
  {
    id: "neon",
    title: "Neon Drift",
    rootBase: 48,
    scale: NEON_SCALE,
    leadWave: "triangle",
    bassWave: "sine",
    leadPattern: [1, 0, 1, 1, 1, 0, 1, 0],
    bassPattern: [1, 0, 0, 0, 1, 0, 0, 0],
    tempoRange: { min: 112, max: 120 },
  },
  {
    id: "arcade",
    title: "Arcade Drive",
    rootBase: 50,
    scale: ARCADE_SCALE,
    leadWave: "square",
    bassWave: "triangle",
    leadPattern: [1, 1, 0, 1, 1, 1, 0, 1],
    bassPattern: [1, 0, 1, 0, 1, 0, 1, 0],
    tempoRange: { min: 122, max: 130 },
  },
  {
    id: "chase",
    title: "Cyber Chase",
    rootBase: 45,
    scale: CHASE_SCALE,
    leadWave: "sawtooth",
    bassWave: "square",
    leadPattern: [1, 1, 1, 0, 1, 1, 0, 1],
    bassPattern: [1, 0, 0, 1, 1, 0, 0, 1],
    tempoRange: { min: 132, max: 140 },
  },
  {
    id: "final",
    title: "Final Surge",
    rootBase: 47,
    scale: FINAL_SCALE,
    leadWave: "triangle",
    bassWave: "sawtooth",
    leadPattern: [1, 1, 1, 1, 1, 1, 0, 1],
    bassPattern: [1, 0, 1, 0, 1, 0, 1, 1],
    tempoRange: { min: 142, max: 146 },
  },
] as const;

function clampStageNumber(stageNumber: number): number {
  if (!Number.isFinite(stageNumber)) {
    return 1;
  }
  return Math.max(1, Math.min(STAGE_COUNT, Math.round(stageNumber)));
}

function stageTempo(stageNumber: number): number {
  const stage = clampStageNumber(stageNumber);
  const theme = getThemeByStage(stage);
  const local = ((stage - 1) % 3) / 2;
  return Math.round(theme.tempoRange.min + (theme.tempoRange.max - theme.tempoRange.min) * local);
}

function getThemeByStage(stageNumber: number): ThemeDefinition {
  const stage = clampStageNumber(stageNumber);
  if (stage <= 3) {
    return THEMES[0];
  }
  if (stage <= 6) {
    return THEMES[1];
  }
  if (stage <= 9) {
    return THEMES[2];
  }
  return THEMES[3];
}

function buildTitleTrack(): BgmTrack {
  const steps: BgmStep[] = [];
  for (let index = 0; index < STEP_COUNT; index += 1) {
    const scaleIndex = (index + (index % 3)) % NEON_SCALE.length;
    const leadMidi = TITLE_ROOT + 12 + NEON_SCALE[scaleIndex];
    const bassMidi =
      index % 2 === 0 ? TITLE_ROOT - 12 + NEON_SCALE[(scaleIndex + 4) % NEON_SCALE.length] : undefined;
    steps.push({
      leadMidi,
      bassMidi,
      leadGain: index % 4 === 0 ? 0.1 : 0.075,
      bassGain: bassMidi ? 0.062 : undefined,
    });
  }
  return {
    id: "title",
    theme: "Title Prelude",
    tempo: 108,
    leadWave: "triangle",
    bassWave: "sine",
    steps,
  };
}

function buildStageTrack(stageNumber: number): BgmTrack {
  const stage = clampStageNumber(stageNumber);
  const theme = getThemeByStage(stage);
  const root = theme.rootBase + ((stage - 1) % 3);
  const rotation = stage % theme.scale.length;
  const rhythmicOffset = stage % RHYTHM_LENGTH;
  const steps: BgmStep[] = [];

  for (let index = 0; index < STEP_COUNT; index += 1) {
    const rotatedIndex = (index + rotation) % theme.scale.length;
    const accentIndex = (index + rhythmicOffset) % RHYTHM_LENGTH;
    const leadOn = theme.leadPattern[accentIndex] === 1;
    const bassOn = theme.bassPattern[accentIndex] === 1;

    const leadMidi = leadOn ? root + 12 + theme.scale[rotatedIndex] : undefined;
    const bassMidi = bassOn ? root - 12 + theme.scale[(rotatedIndex + 3) % theme.scale.length] : undefined;
    const leadAccent = accentIndex === 0 || accentIndex === 4;
    const bassAccent = accentIndex === 0;

    steps.push({
      leadMidi,
      bassMidi,
      leadGain: leadMidi ? (leadAccent ? 0.12 : 0.088) : undefined,
      bassGain: bassMidi ? (bassAccent ? 0.085 : 0.072) : undefined,
    });
  }

  return {
    id: `stage-${stage}`,
    theme: `${theme.title} S${stage}`,
    tempo: stageTempo(stage),
    leadWave: theme.leadWave,
    bassWave: theme.bassWave,
    steps,
  };
}

const TITLE_TRACK = buildTitleTrack();
const STAGE_TRACKS = Array.from({ length: STAGE_COUNT }, (_, index) => buildStageTrack(index + 1));

export function getTitleBgmTrack(): BgmTrack {
  return TITLE_TRACK;
}

export function getStageBgmTrack(stageNumber: number): BgmTrack {
  return STAGE_TRACKS[clampStageNumber(stageNumber) - 1];
}

export function getAllStageBgmTracks(): readonly BgmTrack[] {
  return STAGE_TRACKS;
}
