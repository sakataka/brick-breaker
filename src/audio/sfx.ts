export type EventName = 'wall' | 'paddle' | 'brick' | 'miss' | 'clear';

interface SfxConfig {
  freq: number;
  type: OscillatorType;
  durationMs: number;
  gain: number;
}

export class SfxManager {
  private context: AudioContext | null = null;

  constructor() {}

  async resumeIfNeeded(): Promise<void> {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  private tone(name: EventName) {
    const map: Record<EventName, SfxConfig> = {
      wall: { freq: 380, type: 'square', durationMs: 60, gain: 0.07 },
      paddle: { freq: 560, type: 'triangle', durationMs: 65, gain: 0.08 },
      brick: { freq: 780, type: 'triangle', durationMs: 55, gain: 0.08 },
      miss: { freq: 160, type: 'sawtooth', durationMs: 130, gain: 0.07 },
      clear: { freq: 900, type: 'sine', durationMs: 250, gain: 0.11 },
    };
    return map[name];
  }

  async play(name: EventName): Promise<void> {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!this.context || this.context.state === 'suspended') {
      try {
        await this.context?.resume();
      } catch {
        return;
      }
    }

    if (!this.context) {
      return;
    }

    const cfg = this.tone(name);
    const now = this.context.currentTime;
    const duration = cfg.durationMs / 1000;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, now);
    gain.gain.setValueAtTime(cfg.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start(now);
    osc.stop(now + duration);
  }
}
