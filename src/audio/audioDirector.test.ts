import { describe, expect, test } from "bun:test";

import { AudioDirector } from "./audioDirector";
import type { BgmTrack } from "./bgmCatalog";
import type { BgmController } from "./bgmSequencer";
import type { EventName } from "./sfx";

class FakeSequencer implements BgmController {
  readonly actions: string[] = [];
  play(track: BgmTrack): void {
    this.actions.push(`play:${track.id}`);
  }
  pause(): void {
    this.actions.push("pause");
  }
  resume(): void {
    this.actions.push("resume");
  }
  stop(): void {
    this.actions.push("stop");
  }
  setEnabled(enabled: boolean): void {
    this.actions.push(`enabled:${enabled}`);
  }
  attachContext(): void {
    this.actions.push("attach");
  }
  destroy(): void {
    this.actions.push("destroy");
  }
}

class FakeSfx {
  readonly events: Array<{ name: EventName; force: boolean }> = [];
  sfxEnabled = true;

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  async getContext(): Promise<AudioContext | null> {
    return null;
  }

  async resumeIfNeeded(): Promise<void> {}

  async play(name: EventName, options: { force?: boolean } = {}): Promise<void> {
    this.events.push({ name, force: options.force ?? false });
  }
}

class FakeScheduler {
  private nextId = 1;
  private tasks = new Map<ReturnType<typeof setTimeout>, () => void>();

  setTimeout(handler: () => void): ReturnType<typeof setTimeout> {
    const id = this.nextId;
    this.nextId += 1;
    const handle = id as unknown as ReturnType<typeof setTimeout>;
    this.tasks.set(handle, handler);
    return handle;
  }

  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    this.tasks.delete(id);
  }

  flushAll(): void {
    const entries = [...this.tasks.entries()];
    this.tasks.clear();
    for (const [, task] of entries) {
      task();
    }
  }
}

describe("AudioDirector", () => {
  test("start -> playing triggers start jingle and then stage bgm", () => {
    const sequencer = new FakeSequencer();
    const sfx = new FakeSfx();
    const scheduler = new FakeScheduler();
    const director = new AudioDirector(sfx as never, { sequencer, scheduler });
    director.notifyStageChanged(0);

    director.syncScene("start", "start");
    director.syncScene("playing", "start");
    expect(sfx.events.map((event) => event.name)).toContain("jingle_start");
    expect(sequencer.actions).toContain("stop");

    scheduler.flushAll();
    expect(sequencer.actions).toContain("play:stage-1");
  });

  test("playing -> stageclear stops bgm and plays stage clear jingle", () => {
    const sequencer = new FakeSequencer();
    const sfx = new FakeSfx();
    const director = new AudioDirector(sfx as never, { sequencer });

    director.notifyStageChanged(2);
    director.syncScene("playing", "start");
    director.syncScene("stageclear", "playing");

    expect(sequencer.actions).toContain("stop");
    expect(sfx.events.some((event) => event.name === "jingle_stage_clear" && event.force)).toBe(true);
  });

  test("playing -> clear plays game clear jingle without restarting bgm", () => {
    const sequencer = new FakeSequencer();
    const sfx = new FakeSfx();
    const director = new AudioDirector(sfx as never, { sequencer });

    director.notifyStageChanged(11);
    director.syncScene("playing", "stageclear");
    director.syncScene("clear", "playing");

    expect(sequencer.actions).toContain("stop");
    expect(sfx.events.some((event) => event.name === "jingle_game_clear" && event.force)).toBe(true);
  });

  test("paused -> playing resumes current stage bgm", () => {
    const sequencer = new FakeSequencer();
    const sfx = new FakeSfx();
    const director = new AudioDirector(sfx as never, { sequencer });

    director.notifyStageChanged(4);
    director.syncScene("playing", "stageclear");
    director.syncScene("paused", "playing");
    director.syncScene("playing", "paused");

    expect(sequencer.actions).toContain("pause");
    expect(sequencer.actions).toContain("resume");
  });
});
