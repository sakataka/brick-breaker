export type EventName =
  | "wall"
  | "paddle"
  | "brick"
  | "miss"
  | "clear"
  | "item_paddle_plus"
  | "item_slow_ball"
  | "item_multiball"
  | "item_shield"
  | "item_pierce"
  | "item_bomb"
  | "item_laser"
  | "item_sticky"
  | "shield_burst"
  | "magic_cast"
  | "combo_fill"
  | "jingle_start"
  | "jingle_stage_clear"
  | "jingle_game_clear"
  | "jingle_game_over";

interface ToneSegment {
  freq: number;
  type: OscillatorType;
  durationMs: number;
  gain: number;
  glideTo?: number;
}

interface PlayOptions {
  force?: boolean;
}

export class SfxManager {
  private context: AudioContext | null = null;
  private sfxEnabled = true;

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  async getContext(): Promise<AudioContext | null> {
    return this.ensureContext();
  }

  async resumeIfNeeded(): Promise<void> {
    const context = await this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }
  }

  async play(name: EventName, options: PlayOptions = {}): Promise<void> {
    if (!this.sfxEnabled && !options.force) {
      return;
    }
    const context = await this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    try {
      const sequence = this.getToneSequence(name);
      let cursorSec = context.currentTime;
      for (const segment of sequence) {
        const durationSec = segment.durationMs / 1000;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = segment.type;
        osc.frequency.setValueAtTime(segment.freq, cursorSec);
        if (typeof segment.glideTo === "number") {
          osc.frequency.linearRampToValueAtTime(segment.glideTo, cursorSec + durationSec);
        }
        gain.gain.setValueAtTime(segment.gain, cursorSec);
        gain.gain.exponentialRampToValueAtTime(0.001, cursorSec + durationSec);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(cursorSec);
        osc.stop(cursorSec + durationSec);
        cursorSec += durationSec * 0.92;
      }
    } catch {
      return;
    }
  }

  private getToneSequence(name: EventName): ToneSegment[] {
    const map: Record<EventName, ToneSegment[]> = {
      wall: [{ freq: 380, type: "square", durationMs: 60, gain: 0.07 }],
      paddle: [{ freq: 560, type: "triangle", durationMs: 65, gain: 0.08 }],
      brick: [{ freq: 780, type: "triangle", durationMs: 55, gain: 0.08 }],
      miss: [{ freq: 160, type: "sawtooth", durationMs: 130, gain: 0.07 }],
      clear: [{ freq: 900, type: "sine", durationMs: 250, gain: 0.11 }],
      item_paddle_plus: [
        { freq: 680, type: "triangle", durationMs: 90, gain: 0.09 },
        { freq: 880, type: "triangle", durationMs: 110, gain: 0.08 },
      ],
      item_slow_ball: [{ freq: 640, type: "sine", durationMs: 180, gain: 0.08, glideTo: 380 }],
      item_multiball: [
        { freq: 760, type: "triangle", durationMs: 75, gain: 0.08 },
        { freq: 980, type: "triangle", durationMs: 75, gain: 0.075 },
      ],
      item_shield: [
        { freq: 720, type: "sine", durationMs: 110, gain: 0.07 },
        { freq: 1080, type: "sine", durationMs: 140, gain: 0.07 },
      ],
      item_pierce: [{ freq: 1280, type: "square", durationMs: 90, gain: 0.062 }],
      item_bomb: [{ freq: 220, type: "sawtooth", durationMs: 170, gain: 0.09, glideTo: 120 }],
      item_laser: [
        { freq: 920, type: "square", durationMs: 70, gain: 0.07 },
        { freq: 1260, type: "square", durationMs: 90, gain: 0.07 },
      ],
      item_sticky: [
        { freq: 430, type: "triangle", durationMs: 80, gain: 0.065 },
        { freq: 520, type: "triangle", durationMs: 120, gain: 0.065 },
      ],
      shield_burst: [
        { freq: 300, type: "sawtooth", durationMs: 100, gain: 0.07 },
        { freq: 620, type: "triangle", durationMs: 110, gain: 0.07 },
        { freq: 980, type: "triangle", durationMs: 110, gain: 0.065 },
      ],
      magic_cast: [
        { freq: 420, type: "sine", durationMs: 110, gain: 0.06 },
        { freq: 860, type: "triangle", durationMs: 110, gain: 0.065 },
        { freq: 1320, type: "triangle", durationMs: 130, gain: 0.07 },
      ],
      combo_fill: [
        { freq: 980, type: "triangle", durationMs: 90, gain: 0.07 },
        { freq: 1220, type: "triangle", durationMs: 100, gain: 0.07 },
        { freq: 1480, type: "triangle", durationMs: 120, gain: 0.068 },
      ],
      jingle_start: [
        { freq: 560, type: "triangle", durationMs: 180, gain: 0.08 },
        { freq: 680, type: "triangle", durationMs: 180, gain: 0.08 },
        { freq: 840, type: "triangle", durationMs: 220, gain: 0.09 },
        { freq: 980, type: "triangle", durationMs: 220, gain: 0.1 },
      ],
      jingle_stage_clear: [
        { freq: 620, type: "sine", durationMs: 180, gain: 0.08 },
        { freq: 820, type: "sine", durationMs: 220, gain: 0.09 },
        { freq: 1020, type: "sine", durationMs: 240, gain: 0.1 },
      ],
      jingle_game_clear: [
        { freq: 620, type: "sine", durationMs: 220, gain: 0.09 },
        { freq: 820, type: "sine", durationMs: 230, gain: 0.095 },
        { freq: 980, type: "sine", durationMs: 260, gain: 0.1 },
        { freq: 1180, type: "sine", durationMs: 320, gain: 0.105 },
      ],
      jingle_game_over: [
        { freq: 480, type: "triangle", durationMs: 220, gain: 0.08 },
        { freq: 360, type: "triangle", durationMs: 240, gain: 0.075 },
        { freq: 250, type: "sawtooth", durationMs: 260, gain: 0.07 },
      ],
    };

    return map[name];
  }

  private async ensureContext(): Promise<AudioContext | null> {
    if (!this.context) {
      const AudioCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }

      try {
        this.context = new AudioCtor();
      } catch {
        return null;
      }
    }
    return this.context;
  }
}
