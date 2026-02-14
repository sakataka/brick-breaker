import { getItemPickupSfxEvent } from "../game/itemRegistry";
import type { ItemType } from "../game/types";
import type { SfxManager } from "./sfx";

export class ToneSfx {
  constructor(private readonly sfx: SfxManager) {}

  setEnabled(enabled: boolean): void {
    this.sfx.setSfxEnabled(enabled);
  }

  playItem(itemType: ItemType): void {
    void this.sfx.play(getItemPickupSfxEvent(itemType));
  }

  playStartJingle(): void {
    void this.sfx.play("jingle_start", { force: true });
  }

  playStageClearJingle(): void {
    void this.sfx.play("jingle_stage_clear", { force: true });
  }

  playGameClearJingle(): void {
    void this.sfx.play("jingle_game_clear", { force: true });
  }

  playGameOverJingle(): void {
    void this.sfx.play("jingle_game_over", { force: true });
  }

  playComboFill(): void {
    void this.sfx.play("combo_fill");
  }

  playMagicCast(): void {
    void this.sfx.play("magic_cast");
  }
}
