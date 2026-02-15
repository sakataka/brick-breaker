export interface BgmStep {
  leadMidi?: number;
  harmonyMidis?: readonly number[];
  counterMidi?: number;
  padMidis?: readonly number[];
  bassMidi?: number;
  leadGain?: number;
  harmonyGain?: number;
  counterGain?: number;
  padGain?: number;
  bassGain?: number;
}

export interface BgmTrack {
  id: string;
  theme: string;
  tempo: number;
  leadWave: OscillatorType;
  harmonyWave: OscillatorType;
  bassWave: OscillatorType;
  steps: readonly BgmStep[];
}

type MidiNote = number | null;

interface ThemeDefinition {
  id: "bach_dance" | "mozart_light" | "bach_counter" | "beethoven_drive";
  title: string;
  source: string;
  leadWave: OscillatorType;
  harmonyWave: OscillatorType;
  bassWave: OscillatorType;
  tempoRange: { min: number; max: number };
  leadMotif: readonly MidiNote[];
  bassMotif: readonly MidiNote[];
  harmonyIntervals: readonly [number, number];
  counterOffsets: readonly number[];
  padIntervals: readonly [number, number];
  arrangement: {
    harmonyDensity: readonly [number, number, number];
    counterDensity: readonly [number, number, number];
    padEverySteps: readonly [number, number, number];
  };
  transposeByVariant: readonly number[];
}

const STAGE_COUNT = 12;
const BARS = 8;
const STEPS_PER_BAR = 4;
const STEP_COUNT = BARS * STEPS_PER_BAR;
const STAGE_INTENSITY_COUNT = 3;

const THEMES: readonly ThemeDefinition[] = [
  {
    id: "bach_dance",
    title: "Bach Dance",
    source: "Bach Minuet in G major (BWV Anh. 114) motif",
    leadWave: "triangle",
    harmonyWave: "square",
    bassWave: "sine",
    tempoRange: { min: 114, max: 120 },
    leadMotif: [74, 79, 81, 83, 84, 83, 81, 79, 78, 79, 81, 83, 81, 79, 78, 79],
    bassMotif: [55, null, 59, null, 62, null, 59, null],
    harmonyIntervals: [-4, -7],
    counterOffsets: [7, 4, 7, 2],
    padIntervals: [-5, -9],
    arrangement: {
      harmonyDensity: [0.38, 0.62, 0.84],
      counterDensity: [0.18, 0.34, 0.56],
      padEverySteps: [16, 8, 4],
    },
    transposeByVariant: [0, 2, 4],
  },
  {
    id: "mozart_light",
    title: "Mozart Light",
    source: "Mozart Sonata K.545 motif",
    leadWave: "square",
    harmonyWave: "triangle",
    bassWave: "triangle",
    tempoRange: { min: 122, max: 130 },
    leadMotif: [76, 74, 72, 74, 76, 79, 77, 76, 74, 72, 74, 76, 77, 79, 81, 79],
    bassMotif: [48, null, 55, null, 52, null, 55, null],
    harmonyIntervals: [-4, -7],
    counterOffsets: [4, 7, 9, 7],
    padIntervals: [-4, -7],
    arrangement: {
      harmonyDensity: [0.34, 0.58, 0.8],
      counterDensity: [0.14, 0.3, 0.52],
      padEverySteps: [16, 8, 4],
    },
    transposeByVariant: [0, 2, 4],
  },
  {
    id: "bach_counter",
    title: "Bach Counter",
    source: "Bach Invention No.1 (BWV 772) motif",
    leadWave: "sawtooth",
    harmonyWave: "square",
    bassWave: "square",
    tempoRange: { min: 132, max: 140 },
    leadMotif: [74, 76, 77, 79, 81, 79, 77, 76, 74, 72, 71, 72, 74, 76, 77, 79],
    bassMotif: [50, null, 57, null, 53, null, 57, null],
    harmonyIntervals: [-3, -7],
    counterOffsets: [3, 5, 7, 10],
    padIntervals: [-3, -7],
    arrangement: {
      harmonyDensity: [0.44, 0.68, 0.88],
      counterDensity: [0.24, 0.42, 0.64],
      padEverySteps: [16, 8, 4],
    },
    transposeByVariant: [0, 1, 3],
  },
  {
    id: "beethoven_drive",
    title: "Beethoven Drive",
    source: "Beethoven Symphony No.9 (Ode to Joy) motif",
    leadWave: "triangle",
    harmonyWave: "square",
    bassWave: "sawtooth",
    tempoRange: { min: 142, max: 148 },
    leadMotif: [76, 76, 77, 79, 79, 77, 76, 74, 72, 72, 74, 76, 74, 72, 72, null],
    bassMotif: [48, null, 55, null, 52, null, 55, null],
    harmonyIntervals: [-3, -7],
    counterOffsets: [12, 7, 5, 7],
    padIntervals: [-5, -8],
    arrangement: {
      harmonyDensity: [0.48, 0.7, 0.9],
      counterDensity: [0.2, 0.38, 0.58],
      padEverySteps: [8, 4, 4],
    },
    transposeByVariant: [0, 1, 2],
  },
] as const;

function clampStageNumber(stageNumber: number): number {
  if (!Number.isFinite(stageNumber)) {
    return 1;
  }
  return Math.max(1, Math.min(STAGE_COUNT, Math.round(stageNumber)));
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

function getThemeTempo(stageNumber: number): number {
  const stage = clampStageNumber(stageNumber);
  const theme = getThemeByStage(stage);
  const localRatio = ((stage - 1) % 3) / 2;
  return Math.round(theme.tempoRange.min + (theme.tempoRange.max - theme.tempoRange.min) * localRatio);
}

function buildTitleTrack(): BgmTrack {
  const lead = repeatToLength([60, 64, 67, 72, 67, 64, 60, 64, 62, 65, 69, 74, 69, 65, 62, 65], STEP_COUNT);
  const bass = repeatToLength([48, null, 55, null, 52, null, 55, null], STEP_COUNT);
  return {
    id: "title",
    theme: "Classical Prelude",
    tempo: 108,
    leadWave: "triangle",
    harmonyWave: "square",
    bassWave: "sine",
    steps: buildSteps(lead, bass, {
      stageNumber: 1,
      harmonyIntervals: [-5, -9],
      counterOffsets: [7, 9, 12, 9],
      padIntervals: [-5, -9],
      arrangement: {
        harmonyDensity: [0.5, 0.5, 0.5],
        counterDensity: [0.24, 0.24, 0.24],
        padEverySteps: [8, 8, 8],
      },
      leadBaseGain: 0.102,
      harmonyBaseGain: 0.045,
      bassBaseGain: 0.072,
    }),
  };
}

function buildStageTrack(stageNumber: number): BgmTrack {
  const stage = clampStageNumber(stageNumber);
  const theme = getThemeByStage(stage);
  const variant = (stage - 1) % 3;
  const transpose = theme.transposeByVariant[variant] ?? 0;
  const leadRotation = variant * 2;
  const bassRotation = variant;
  const lead = transposeSequence(
    rotateSequence(repeatToLength(theme.leadMotif, STEP_COUNT), leadRotation),
    transpose,
  );
  const bass = transposeSequence(
    rotateSequence(repeatToLength(theme.bassMotif, STEP_COUNT), bassRotation),
    transpose,
  );

  return {
    id: `stage-${stage}`,
    theme: `${theme.title} S${stage} (${theme.source})`,
    tempo: getThemeTempo(stage),
    leadWave: theme.leadWave,
    harmonyWave: theme.harmonyWave,
    bassWave: theme.bassWave,
    steps: buildSteps(lead, bass, {
      stageNumber: stage,
      harmonyIntervals: theme.harmonyIntervals,
      counterOffsets: theme.counterOffsets,
      padIntervals: theme.padIntervals,
      arrangement: theme.arrangement,
      leadBaseGain: 0.114,
      harmonyBaseGain: 0.051,
      bassBaseGain: 0.082,
    }),
  };
}

interface BuildStepOptions {
  stageNumber: number;
  harmonyIntervals: readonly [number, number];
  counterOffsets: readonly number[];
  padIntervals: readonly [number, number];
  arrangement: ThemeDefinition["arrangement"];
  leadBaseGain: number;
  harmonyBaseGain: number;
  bassBaseGain: number;
}

function buildSteps(
  leadNotes: readonly MidiNote[],
  bassNotes: readonly MidiNote[],
  options: BuildStepOptions,
): BgmStep[] {
  const intensity = getStageLocalIntensity(options.stageNumber);
  const harmonyDensity = options.arrangement.harmonyDensity[intensity];
  const counterDensity = options.arrangement.counterDensity[intensity];
  const padEverySteps = options.arrangement.padEverySteps[intensity];
  const steps: BgmStep[] = [];
  for (let index = 0; index < STEP_COUNT; index += 1) {
    const leadMidi = leadNotes[index] ?? undefined;
    const bassMidi = bassNotes[index] ?? undefined;
    const accent = index % 8 === 0;
    const semiAccent = index % 8 === 4;
    const harmonyMidis = buildHarmonyMidis(
      leadMidi,
      bassMidi,
      index,
      accent || semiAccent,
      options.harmonyIntervals,
      harmonyDensity,
    );
    const counterMidi = buildCounterMidi(leadMidi, bassMidi, index, options.counterOffsets, counterDensity);
    const padMidis = buildPadMidis(leadMidi, bassMidi, index, padEverySteps, options.padIntervals);
    steps.push({
      leadMidi,
      harmonyMidis,
      counterMidi,
      padMidis,
      bassMidi,
      leadGain: leadMidi
        ? accent
          ? options.leadBaseGain + 0.02
          : semiAccent
            ? options.leadBaseGain + 0.01
            : options.leadBaseGain
        : undefined,
      harmonyGain:
        harmonyMidis.length > 0
          ? accent
            ? options.harmonyBaseGain + 0.01
            : options.harmonyBaseGain
          : undefined,
      counterGain: typeof counterMidi === "number" ? (semiAccent ? 0.048 : 0.042) : undefined,
      padGain: padMidis.length > 0 ? (accent ? 0.03 : 0.026) : undefined,
      bassGain: bassMidi ? (accent ? options.bassBaseGain + 0.008 : options.bassBaseGain) : undefined,
    });
  }
  return steps;
}

function buildHarmonyMidis(
  leadMidi: number | undefined,
  bassMidi: number | undefined,
  index: number,
  emphasize: boolean,
  harmonyIntervals: readonly [number, number],
  density: number,
): number[] {
  if (typeof leadMidi !== "number") {
    return [];
  }
  if (!matchesDensity(index, density, 11)) {
    return [];
  }
  const primary = leadMidi + harmonyIntervals[0];
  const secondary = leadMidi + harmonyIntervals[1];
  const candidates = [primary, secondary].filter((midi) => midi >= 40);
  const filtered = removeBassClashes(candidates, bassMidi);
  if (emphasize) {
    return filtered;
  }
  if (index % 2 === 0 && filtered.length > 0) {
    return [filtered[0]];
  }
  return [];
}

function buildCounterMidi(
  leadMidi: number | undefined,
  bassMidi: number | undefined,
  index: number,
  counterOffsets: readonly number[],
  density: number,
): number | undefined {
  if (typeof leadMidi !== "number" || !matchesDensity(index, density, 29)) {
    return undefined;
  }
  if (index % 2 === 0) {
    return undefined;
  }
  const offset = counterOffsets[index % counterOffsets.length] ?? 7;
  const candidate = leadMidi + offset;
  if (candidate < 48) {
    return undefined;
  }
  if (typeof bassMidi === "number" && Math.abs(candidate - bassMidi) < 7) {
    return candidate + 12;
  }
  return candidate;
}

function buildPadMidis(
  leadMidi: number | undefined,
  bassMidi: number | undefined,
  index: number,
  everySteps: number,
  padIntervals: readonly [number, number],
): number[] {
  if (typeof leadMidi !== "number" || everySteps <= 0 || index % everySteps !== 0) {
    return [];
  }
  const first = leadMidi + padIntervals[0];
  const second = leadMidi + padIntervals[1];
  const candidates = [first, second].filter((midi) => midi >= 40);
  return removeBassClashes(candidates, bassMidi);
}

function removeBassClashes(notes: readonly number[], bassMidi: number | undefined): number[] {
  if (typeof bassMidi !== "number") {
    return [...notes];
  }
  return notes.filter((midi) => Math.abs(midi - bassMidi) >= 5);
}

function matchesDensity(index: number, density: number, salt: number): boolean {
  if (density >= 1) {
    return true;
  }
  if (density <= 0) {
    return false;
  }
  const normalized = ((index * 37 + salt * 13) % 100) / 100;
  return normalized < density;
}

function getStageLocalIntensity(stageNumber: number): 0 | 1 | 2 {
  const stage = clampStageNumber(stageNumber);
  const local = (stage - 1) % STAGE_INTENSITY_COUNT;
  if (local === 0) {
    return 0;
  }
  if (local === 1) {
    return 1;
  }
  return 2;
}

function repeatToLength<T>(source: readonly T[], length: number): T[] {
  if (source.length === 0) {
    return [];
  }
  const result: T[] = [];
  for (let index = 0; index < length; index += 1) {
    result.push(source[index % source.length]);
  }
  return result;
}

function rotateSequence(sequence: readonly MidiNote[], offset: number): MidiNote[] {
  if (sequence.length === 0) {
    return [];
  }
  const normalized = ((offset % sequence.length) + sequence.length) % sequence.length;
  if (normalized === 0) {
    return [...sequence];
  }
  return [...sequence.slice(normalized), ...sequence.slice(0, normalized)];
}

function transposeSequence(sequence: readonly MidiNote[], semitone: number): MidiNote[] {
  if (semitone === 0) {
    return [...sequence];
  }
  return sequence.map((note) => (typeof note === "number" ? note + semitone : null));
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
