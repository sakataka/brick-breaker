import { ROGUE_CONFIG } from "./config";
import type { GameState, RogueUpgradeType } from "./types";

export function applyRogueUpgradeSelection(state: GameState, selected: RogueUpgradeType): void {
  if (!state.rogue.pendingOffer) {
    return;
  }
  if (!state.rogue.pendingOffer.includes(selected)) {
    selected = state.rogue.pendingOffer[0];
  }
  if (state.rogue.upgradesTaken >= ROGUE_CONFIG.maxUpgrades) {
    state.rogue.pendingOffer = null;
    return;
  }
  if (selected === "paddle_core") {
    state.rogue.paddleScaleBonus += ROGUE_CONFIG.paddleScaleStep;
  } else if (selected === "speed_core") {
    state.rogue.maxSpeedScaleBonus += ROGUE_CONFIG.maxSpeedScaleStep;
  } else {
    state.rogue.scoreScaleBonus += ROGUE_CONFIG.scoreScaleStep;
  }
  state.rogue.upgradesTaken += 1;
  state.rogue.lastChosen = selected;
  state.rogue.pendingOffer = null;
}

export function prepareRogueUpgradeOffer(state: GameState): void {
  if (state.rogue.upgradesTaken >= ROGUE_CONFIG.maxUpgrades) {
    state.rogue.pendingOffer = null;
    return;
  }
  const stageNumber = state.campaign.stageIndex + 1;
  if (!ROGUE_CONFIG.checkpointStages.includes(stageNumber)) {
    state.rogue.pendingOffer = null;
    return;
  }

  const upgrades: RogueUpgradeType[] = ["paddle_core", "speed_core", "score_core"];
  const pivot = (stageNumber + state.rogue.upgradesTaken + state.lives) % upgrades.length;
  const first = upgrades[pivot];
  const second = upgrades[(pivot + 1) % upgrades.length];
  state.rogue.pendingOffer = [first, second];
}
