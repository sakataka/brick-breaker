import type { MusicCue, MusicCueId } from "../game-v2/public/types";
import { PUBLIC_STAGE_BLUEPRINTS, getStageMusicCue } from "../game-v2/content/stageBlueprints";

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

interface CueDefinition {
  id: Exclude<MusicCueId, "title">;
  title: string;
  leadWave: OscillatorType;
  harmonyWave: OscillatorType;
  bassWave: OscillatorType;
  tempoBase: number;
  tempoStep: number;
  leadPattern: readonly (number | null)[];
  chordRoots: readonly number[];
  chordIntervals: readonly number[];
  counterOffsets: readonly number[];
  padIntervals: readonly number[];
  bassOffsets: readonly number[];
}

const STEPS_PER_TRACK = 32;

const CUES: Record<CueDefinition["id"], CueDefinition> = {
  chapter1: {
    id: "chapter1",
    title: "Neon Pop Rise",
    leadWave: "triangle",
    harmonyWave: "triangle",
    bassWave: "sine",
    tempoBase: 128,
    tempoStep: 5,
    leadPattern: [0, 2, 4, 7, 9, 7, 4, 2, 0, 2, 4, 7, 11, 9, 7, 4],
    chordRoots: [60, 65, 69, 67],
    chordIntervals: [0, 4, 7, 11, 14],
    counterOffsets: [12, 14, 9, 7, 4],
    padIntervals: [0, 7, 11, 14],
    bassOffsets: [-24, -17, -24, -19],
  },
  chapter2: {
    id: "chapter2",
    title: "Factory Pop Rush",
    leadWave: "square",
    harmonyWave: "triangle",
    bassWave: "square",
    tempoBase: 140,
    tempoStep: 6,
    leadPattern: [0, 3, 5, 7, 10, 7, 5, 3, 0, 3, 5, 8, 10, 8, 7, 5],
    chordRoots: [57, 62, 65, 64],
    chordIntervals: [0, 3, 7, 10, 14],
    counterOffsets: [7, 10, 12, 15, 10],
    padIntervals: [0, 5, 10, 14],
    bassOffsets: [-24, -17, -24, -19],
  },
  chapter3: {
    id: "chapter3",
    title: "Voltage Arcade",
    leadWave: "sawtooth",
    harmonyWave: "square",
    bassWave: "sawtooth",
    tempoBase: 150,
    tempoStep: 7,
    leadPattern: [0, 2, 3, 7, 10, 7, 3, 2, 0, 2, 3, 7, 12, 10, 7, 3],
    chordRoots: [55, 60, 62, 64],
    chordIntervals: [0, 3, 7, 10, 14],
    counterOffsets: [12, 15, 7, 10, 14],
    padIntervals: [0, 7, 10, 14],
    bassOffsets: [-24, -12, -24, -17],
  },
  midboss: {
    id: "midboss",
    title: "Pressure Spark",
    leadWave: "sawtooth",
    harmonyWave: "triangle",
    bassWave: "square",
    tempoBase: 166,
    tempoStep: 7,
    leadPattern: [0, 3, 7, 10, 12, 10, 7, 3, 0, 3, 7, 12, 14, 12, 10, 7],
    chordRoots: [53, 58, 60, 62],
    chordIntervals: [0, 3, 7, 10, 14],
    counterOffsets: [15, 12, 17, 10, 7],
    padIntervals: [0, 7, 10, 14],
    bassOffsets: [-24, -19, -24, -17],
  },
  finalboss: {
    id: "finalboss",
    title: "Neon Breaker Core",
    leadWave: "triangle",
    harmonyWave: "sawtooth",
    bassWave: "sawtooth",
    tempoBase: 178,
    tempoStep: 0,
    leadPattern: [0, 4, 7, 11, 12, 11, 7, 4, 0, 4, 7, 12, 14, 12, 11, 7],
    chordRoots: [48, 55, 53, 58],
    chordIntervals: [0, 4, 7, 10, 14],
    counterOffsets: [12, 16, 19, 14, 11],
    padIntervals: [0, 7, 10, 14],
    bassOffsets: [-24, -12, -17, -12],
  },
  tier2: {
    id: "tier2",
    title: "Tier 2 Hyper Pop",
    leadWave: "square",
    harmonyWave: "triangle",
    bassWave: "square",
    tempoBase: 186,
    tempoStep: 6,
    leadPattern: [0, 4, 7, 9, 12, 9, 7, 4, 0, 4, 7, 11, 14, 11, 9, 7],
    chordRoots: [61, 66, 68, 70],
    chordIntervals: [0, 4, 7, 11, 14],
    counterOffsets: [14, 18, 11, 9, 7],
    padIntervals: [0, 7, 11, 14],
    bassOffsets: [-24, -17, -12, -19],
  },
};

const TITLE_TRACK: BgmTrack = {
  id: "title",
  theme: "Neon Pop Overture",
  tempo: 118,
  leadWave: "triangle",
  harmonyWave: "triangle",
  bassWave: "sine",
  steps: buildTrackSteps({
    leadPattern: [0, 4, 7, 11, 7, 4, 0, 4, 2, 5, 9, 12, 9, 5, 2, 5],
    chordRoots: [60, 65, 67, 69],
    chordIntervals: [0, 4, 7, 11, 14],
    counterOffsets: [7, 11, 14, 9, 12],
    padIntervals: [0, 7, 11, 14],
    bassOffsets: [-24, -17, -24, -12],
    variant: 1,
  }),
};

export function getTitleBgmTrack(): BgmTrack {
  return TITLE_TRACK;
}

export function getCueBgmTrack(cue: MusicCue): BgmTrack {
  if (cue.id === "title") {
    return TITLE_TRACK;
  }
  const definition = CUES[cue.id];
  const variant = Math.max(1, cue.variant);
  return {
    id: `${definition.id}-${variant}`,
    theme: `${definition.title} v${variant}`,
    tempo: definition.tempoBase + definition.tempoStep * (variant - 1),
    leadWave: definition.leadWave,
    harmonyWave: definition.harmonyWave,
    bassWave: definition.bassWave,
    steps: buildTrackSteps({
      leadPattern: definition.leadPattern,
      chordRoots: definition.chordRoots,
      chordIntervals: definition.chordIntervals,
      counterOffsets: definition.counterOffsets,
      padIntervals: definition.padIntervals,
      bassOffsets: definition.bassOffsets,
      variant,
    }),
  };
}

export function getStageBgmTrack(stageNumber: number): BgmTrack {
  const maxStage = PUBLIC_STAGE_BLUEPRINTS[1].length;
  const stage = Math.max(1, Math.min(maxStage, Math.round(stageNumber)));
  return getCueBgmTrack(getStageMusicCue(1, stage));
}

export function getAllStageBgmTracks(): BgmTrack[] {
  return PUBLIC_STAGE_BLUEPRINTS[1].map((blueprint) => getCueBgmTrack(blueprint.musicCue));
}

interface StepBuilderInput {
  leadPattern: readonly (number | null)[];
  chordRoots: readonly number[];
  chordIntervals: readonly number[];
  counterOffsets: readonly number[];
  padIntervals: readonly number[];
  bassOffsets: readonly number[];
  variant: number;
}

function buildTrackSteps(input: StepBuilderInput): readonly BgmStep[] {
  return Array.from({ length: STEPS_PER_TRACK }, (_, index) => {
    const chordIndex = Math.floor(index / 4) % input.chordRoots.length;
    const root = input.chordRoots[chordIndex] + (input.variant - 1);
    const leadOffset = input.leadPattern[index % input.leadPattern.length];
    const strongBeat = index % 4 === 0;
    const offBeat = index % 4 === 2;
    return {
      leadMidi: typeof leadOffset === "number" ? root + leadOffset : undefined,
      harmonyMidis:
        strongBeat || offBeat ? input.chordIntervals.map((interval) => root + interval) : undefined,
      counterMidi:
        !strongBeat || input.variant >= 2
          ? root + input.counterOffsets[index % input.counterOffsets.length]
          : undefined,
      padMidis:
        index % 4 === 0 || (input.variant >= 2 && offBeat)
          ? input.padIntervals.map((interval) => root + interval - 12)
          : undefined,
      bassMidi:
        index % 2 === 0
          ? root + input.bassOffsets[chordIndex % input.bassOffsets.length]
          : undefined,
      leadGain: strongBeat ? 0.11 : 0.09,
      harmonyGain: strongBeat ? 0.12 : 0.09,
      counterGain: 0.064,
      padGain: 0.062,
      bassGain: strongBeat ? 0.128 : 0.102,
    };
  });
}
