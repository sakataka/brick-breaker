export interface BgmStep {
  leadMidi?: number;
  harmonyMidis?: readonly number[];
  bassMidi?: number;
  leadGain?: number;
  harmonyGain?: number;
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
  transposeByVariant: readonly number[];
}

const STAGE_COUNT = 12;
const BARS = 8;
const STEPS_PER_BAR = 4;
const STEP_COUNT = BARS * STEPS_PER_BAR;

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
    steps: buildSteps(lead, bass, 0.102, 0.05, 0.072, [-5, -9]),
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
    steps: buildSteps(lead, bass, 0.118, 0.056, 0.084, theme.harmonyIntervals),
  };
}

function buildSteps(
  leadNotes: readonly MidiNote[],
  bassNotes: readonly MidiNote[],
  leadBaseGain: number,
  harmonyBaseGain: number,
  bassBaseGain: number,
  harmonyIntervals: readonly [number, number],
): BgmStep[] {
  const steps: BgmStep[] = [];
  for (let index = 0; index < STEP_COUNT; index += 1) {
    const leadMidi = leadNotes[index] ?? undefined;
    const bassMidi = bassNotes[index] ?? undefined;
    const accent = index % 8 === 0;
    const semiAccent = index % 8 === 4;
    const harmonyMidis = buildHarmonyMidis(leadMidi, index, accent || semiAccent, harmonyIntervals);
    steps.push({
      leadMidi,
      harmonyMidis,
      bassMidi,
      leadGain: leadMidi
        ? accent
          ? leadBaseGain + 0.02
          : semiAccent
            ? leadBaseGain + 0.01
            : leadBaseGain
        : undefined,
      harmonyGain: harmonyMidis.length > 0 ? (accent ? harmonyBaseGain + 0.012 : harmonyBaseGain) : undefined,
      bassGain: bassMidi ? (accent ? bassBaseGain + 0.01 : bassBaseGain) : undefined,
    });
  }
  return steps;
}

function buildHarmonyMidis(
  leadMidi: number | undefined,
  index: number,
  emphasize: boolean,
  harmonyIntervals: readonly [number, number],
): number[] {
  if (typeof leadMidi !== "number") {
    return [];
  }
  const primary = leadMidi + harmonyIntervals[0];
  const secondary = leadMidi + harmonyIntervals[1];
  if (emphasize) {
    return [primary, secondary].filter((midi) => midi >= 36);
  }
  if (index % 2 === 0 && primary >= 36) {
    return [primary];
  }
  return [];
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
