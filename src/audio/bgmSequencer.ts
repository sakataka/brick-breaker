import type { BgmTrack } from "./bgmCatalog";

export interface BgmController {
  attachContext(context: AudioContext): void;
  setEnabled(enabled: boolean): void;
  play(track: BgmTrack, options?: { fadeMs?: number }): void;
  pause(): void;
  resume(): void;
  stop(fadeMs?: number): void;
  destroy(): void;
}

interface PlaybackLayer {
  track: BgmTrack;
  gainNode: GainNode;
  stepIndex: number;
  nextStepTime: number;
  intervalId: TimerId | null;
}

type TimerId = ReturnType<typeof setInterval>;

const LOOKAHEAD_MS = 50;
const SCHEDULE_AHEAD_SEC = 0.2;
const DEFAULT_FADE_MS = 220;
const MAX_NOTES_PER_STEP = 6;

const VOICE_GAIN = {
  lead: 0.086,
  bass: 0.074,
  harmony: 0.042,
  counter: 0.035,
  pad: 0.028,
} as const;

const VOICE_DURATION = {
  lead: 0.84,
  bass: 0.96,
  harmony: 0.72,
  counter: 0.64,
  pad: 1.36,
} as const;

export class BgmSequencer implements BgmController {
  private context: AudioContext | null = null;
  private enabled = true;
  private targetGain = 0.19;
  private activeLayer: PlaybackLayer | null = null;
  private paused = false;
  private pendingTrack: BgmTrack | null = null;

  attachContext(context: AudioContext): void {
    this.context = context;
    if (this.pendingTrack && this.enabled) {
      this.play(this.pendingTrack);
      this.pendingTrack = null;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop(120);
      return;
    }
    if (this.pendingTrack) {
      this.play(this.pendingTrack);
      this.pendingTrack = null;
    }
  }

  play(track: BgmTrack, options?: { fadeMs?: number }): void {
    if (!this.enabled) {
      this.pendingTrack = track;
      return;
    }
    const context = this.context;
    if (!context) {
      this.pendingTrack = track;
      return;
    }
    const fadeMs = options?.fadeMs ?? DEFAULT_FADE_MS;
    const previous = this.activeLayer;
    if (previous && previous.track.id === track.id && !this.paused) {
      return;
    }

    if (previous) {
      this.stopLayer(previous, fadeMs);
    }

    const layer = this.createLayer(track, context);
    this.activeLayer = layer;
    this.paused = false;
    const now = context.currentTime;
    layer.gainNode.gain.cancelScheduledValues(now);
    layer.gainNode.gain.setValueAtTime(0.0001, now);
    layer.gainNode.gain.linearRampToValueAtTime(this.targetGain, now + fadeMs / 1000);
    this.startScheduler(layer);
  }

  pause(): void {
    const layer = this.activeLayer;
    const context = this.context;
    if (!layer || !context || this.paused) {
      return;
    }
    this.paused = true;
    this.stopScheduler(layer);
    const now = context.currentTime;
    layer.gainNode.gain.cancelScheduledValues(now);
    layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value || this.targetGain, now);
    layer.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.08);
  }

  resume(): void {
    const layer = this.activeLayer;
    const context = this.context;
    if (!layer || !context || !this.enabled || !this.paused) {
      return;
    }
    this.paused = false;
    const now = context.currentTime;
    layer.nextStepTime = now + 0.04;
    layer.gainNode.gain.cancelScheduledValues(now);
    layer.gainNode.gain.setValueAtTime(0.0001, now);
    layer.gainNode.gain.linearRampToValueAtTime(this.targetGain, now + 0.12);
    this.startScheduler(layer);
  }

  stop(fadeMs = DEFAULT_FADE_MS): void {
    if (!this.activeLayer) {
      return;
    }
    this.stopLayer(this.activeLayer, fadeMs);
    this.activeLayer = null;
    this.paused = false;
  }

  destroy(): void {
    this.pendingTrack = null;
    if (this.activeLayer) {
      this.stopLayer(this.activeLayer, 40);
      this.activeLayer = null;
    }
  }

  private createLayer(track: BgmTrack, context: AudioContext): PlaybackLayer {
    const gainNode = context.createGain();
    gainNode.gain.value = 0.0001;
    gainNode.connect(context.destination);
    return {
      track,
      gainNode,
      stepIndex: 0,
      nextStepTime: context.currentTime + 0.04,
      intervalId: null,
    };
  }

  private stopLayer(layer: PlaybackLayer, fadeMs: number): void {
    const context = this.context;
    this.stopScheduler(layer);
    if (!context) {
      try {
        layer.gainNode.disconnect();
      } catch {}
      return;
    }
    const now = context.currentTime;
    layer.gainNode.gain.cancelScheduledValues(now);
    layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value || this.targetGain, now);
    layer.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    setTimeout(
      () => {
        try {
          layer.gainNode.disconnect();
        } catch {}
      },
      Math.max(50, fadeMs + 20),
    );
  }

  private startScheduler(layer: PlaybackLayer): void {
    this.stopScheduler(layer);
    layer.intervalId = setInterval(() => this.scheduleLayer(layer), LOOKAHEAD_MS);
    this.scheduleLayer(layer);
  }

  private stopScheduler(layer: PlaybackLayer): void {
    if (layer.intervalId) {
      clearInterval(layer.intervalId);
      layer.intervalId = null;
    }
  }

  private scheduleLayer(layer: PlaybackLayer): void {
    const context = this.context;
    if (!context || this.paused || !this.enabled || this.activeLayer !== layer) {
      return;
    }

    const stepDurationSec = 60 / layer.track.tempo;
    while (layer.nextStepTime < context.currentTime + SCHEDULE_AHEAD_SEC) {
      const step = layer.track.steps[layer.stepIndex];
      if (step) {
        let notesScheduled = 0;
        if (typeof step.bassMidi === "number") {
          notesScheduled += this.scheduleNote(
            layer,
            step.bassMidi,
            layer.nextStepTime,
            stepDurationSec * VOICE_DURATION.bass,
            Math.min(step.bassGain ?? VOICE_GAIN.bass, VOICE_GAIN.bass),
            layer.track.bassWave,
            notesScheduled,
          );
        }
        if (typeof step.leadMidi === "number") {
          notesScheduled += this.scheduleNote(
            layer,
            step.leadMidi,
            layer.nextStepTime,
            stepDurationSec * VOICE_DURATION.lead,
            Math.min(step.leadGain ?? VOICE_GAIN.lead, VOICE_GAIN.lead),
            layer.track.leadWave,
            notesScheduled,
          );
        }
        if (step.harmonyMidis && step.harmonyMidis.length > 0 && notesScheduled < MAX_NOTES_PER_STEP) {
          const remaining = MAX_NOTES_PER_STEP - notesScheduled;
          const notes = step.harmonyMidis.slice(0, remaining);
          const perNoteGain = Math.min(
            (step.harmonyGain ?? VOICE_GAIN.harmony) / Math.max(1, notes.length),
            VOICE_GAIN.harmony,
          );
          for (const harmonyMidi of notes) {
            notesScheduled += this.scheduleNote(
              layer,
              harmonyMidi,
              layer.nextStepTime,
              stepDurationSec * VOICE_DURATION.harmony,
              perNoteGain,
              layer.track.harmonyWave,
              notesScheduled,
            );
          }
        }
        if (typeof step.counterMidi === "number" && notesScheduled < MAX_NOTES_PER_STEP) {
          notesScheduled += this.scheduleNote(
            layer,
            step.counterMidi,
            layer.nextStepTime,
            stepDurationSec * VOICE_DURATION.counter,
            Math.min(step.counterGain ?? VOICE_GAIN.counter, VOICE_GAIN.counter),
            layer.track.harmonyWave,
            notesScheduled,
          );
        }
        if (step.padMidis && step.padMidis.length > 0 && notesScheduled < MAX_NOTES_PER_STEP) {
          const remaining = MAX_NOTES_PER_STEP - notesScheduled;
          const notes = step.padMidis.slice(0, remaining);
          const perNoteGain = Math.min(
            (step.padGain ?? VOICE_GAIN.pad) / Math.max(1, notes.length),
            VOICE_GAIN.pad,
          );
          for (const padMidi of notes) {
            notesScheduled += this.scheduleNote(
              layer,
              padMidi,
              layer.nextStepTime,
              stepDurationSec * VOICE_DURATION.pad,
              perNoteGain,
              layer.track.harmonyWave,
              notesScheduled,
            );
          }
        }
      }

      layer.nextStepTime += stepDurationSec;
      layer.stepIndex = (layer.stepIndex + 1) % layer.track.steps.length;
    }
  }

  private scheduleNote(
    layer: PlaybackLayer,
    midi: number,
    timeSec: number,
    durationSec: number,
    gainValue: number,
    oscillatorType: OscillatorType,
    notesScheduled: number,
  ): number {
    if (notesScheduled >= MAX_NOTES_PER_STEP) {
      return 0;
    }
    const context = this.context;
    if (!context) {
      return 0;
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = oscillatorType;
    osc.frequency.setValueAtTime(midiToFrequency(midi), timeSec);
    gain.gain.setValueAtTime(gainValue, timeSec);
    gain.gain.exponentialRampToValueAtTime(0.001, timeSec + durationSec);
    osc.connect(gain);
    gain.connect(layer.gainNode);
    osc.start(timeSec);
    osc.stop(timeSec + durationSec);
    return 1;
  }
}

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
