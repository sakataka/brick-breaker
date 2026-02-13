export type EventName = 'wall' | 'paddle' | 'brick' | 'miss' | 'clear';

interface SfxConfig {
  freq: number;
  type: OscillatorType;
  durationMs: number;
  gain: number;
}

export class SfxManager {
  private context: AudioContext | null = null;

  async resumeIfNeeded(): Promise<void> {
    const context = await this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        return;
      }
    }
  }

  async play(name: EventName): Promise<void> {
    const context = await this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    try {
      const cfg = this.getTone(name);
      const now = context.currentTime;
      const duration = cfg.durationMs / 1000;
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.freq, now);
      gain.gain.setValueAtTime(cfg.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      return;
    }
  }

  private getTone(name: EventName): SfxConfig {
    const map: Record<EventName, SfxConfig> = {
      wall: { freq: 380, type: 'square', durationMs: 60, gain: 0.07 },
      paddle: { freq: 560, type: 'triangle', durationMs: 65, gain: 0.08 },
      brick: { freq: 780, type: 'triangle', durationMs: 55, gain: 0.08 },
      miss: { freq: 160, type: 'sawtooth', durationMs: 130, gain: 0.07 },
      clear: { freq: 900, type: 'sine', durationMs: 250, gain: 0.11 },
    };

    return map[name];
  }

  private async ensureContext(): Promise<AudioContext | null> {
    if (!this.context) {
      const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
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
