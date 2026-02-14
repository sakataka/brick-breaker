import { getStageModifier, getStageStory, getThemeBandByStageIndex, ROGUE_CONFIG } from "./config";
import { getActiveItemLabels } from "./itemSystem";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "./renderTypes";
import { getStageClearTimeSec } from "./roundSystem";
import { formatTime } from "./time";
import type { GameState } from "./types";

export function buildRenderViewState(state: GameState): RenderViewState {
  const total = state.bricks.length;
  const alive = state.bricks.reduce((count, brick) => count + (brick.alive ? 1 : 0), 0);
  const progressRatio = total <= 0 ? 0 : Math.max(0, Math.min(1, (total - alive) / total));
  const themeBand = getThemeBandByStageIndex(state.campaign.stageIndex);
  const stageModifier = getStageModifier(state.campaign.stageIndex + 1);

  return {
    scene: state.scene,
    elapsedSec: state.elapsedSec,
    bricks: state.bricks,
    paddle: {
      x: state.paddle.x,
      y: state.paddle.y,
      width: state.paddle.width,
      height: state.paddle.height,
      glowActive: state.items.active.paddlePlusStacks > 0,
    },
    balls: state.balls,
    trail: state.vfx.trail,
    particles: state.vfx.particles,
    impactRings: state.vfx.impactRings,
    floatingTexts: state.vfx.floatingTexts,
    flashMs: state.vfx.flashMs,
    reducedMotion: state.vfx.reducedMotion,
    highContrast: state.a11y.highContrast,
    shake: {
      active: !state.vfx.reducedMotion && state.vfx.shakeMs > 0 && state.vfx.shakePx > 0,
      offset: state.vfx.shakeOffset,
    },
    fallingItems: state.items.falling,
    progressRatio,
    themeBandId: themeBand.id,
    slowBallActive: state.items.active.slowBallStacks > 0,
    multiballActive: state.items.active.multiballStacks > 0,
    shieldCharges: state.items.active.shieldCharges,
    showSceneOverlayTint: state.scene !== "playing",
    enemies: state.enemies,
    stageModifierLabel: stageModifier?.label,
    warpZones: stageModifier?.warpZones,
  };
}

export function buildHudViewModel(state: GameState): HudViewModel {
  const activeItems = getActiveItemLabels(state.items);
  const themeBand = getThemeBandByStageIndex(state.campaign.stageIndex);
  const comboVisible = state.combo.streak > 1;
  const hazardBoostActive = state.elapsedSec < state.hazard.speedBoostUntilSec;
  const pierceSlowSynergy = state.items.active.pierceStacks > 0 && state.items.active.slowBallStacks > 0;
  const bossStageText = buildBossHudText(state);
  const stageModifier = getStageModifier(state.campaign.stageIndex + 1);
  const routeLabel = state.campaign.resolvedRoute ? ` / ルート${state.campaign.resolvedRoute}` : "";
  const modifierLabel = stageModifier?.label;
  const modifierText = modifierLabel ? ` / 修飾:${modifierLabel}` : "";
  const warpLegend = stageModifier?.warpZones?.length ? " / ワープ: 青=入口 / 黄=出口" : "";
  const riskText = state.options.riskMode ? " / 🔥リスクx1.35" : "";
  const rogueText =
    state.rogue.upgradesTaken > 0 ? ` / 強化:${state.rogue.upgradesTaken}/${ROGUE_CONFIG.maxUpgrades}` : "";
  const magicText =
    state.magic.cooldownSec <= 0
      ? " / ✨魔法:READY(右クリック)"
      : ` / ✨魔法:${state.magic.cooldownSec.toFixed(1)}s`;
  return {
    scoreText: `スコア: ${state.score}`,
    livesText: `残機: ${state.lives}`,
    timeText: `時間: ${formatTime(state.elapsedSec)}`,
    stageText: `ステージ: ${state.campaign.stageIndex + 1}/${state.campaign.totalStages}${routeLabel}${modifierText}${bossStageText}`,
    comboText: comboVisible ? `コンボ x${state.combo.multiplier.toFixed(2)}` : "コンボ x1.00",
    itemsText: `アイテム: ${activeItems.join(" / ")}${hazardBoostActive ? " / ⚠危険加速中" : ""}${pierceSlowSynergy ? " / ✨貫通+1" : ""}${riskText}${rogueText}${magicText}${warpLegend}`,
    accessibilityText: buildAccessibilityBadge(state),
    accentColor: comboVisible ? COMBO_ACTIVE_COLOR : themeBand.hudAccent,
  };
}

function buildBossHudText(state: GameState): string {
  const boss = state.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    return "";
  }
  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 12);
  return ` / ボスHP: ${hp}/${maxHp}`;
}

export function buildOverlayViewModel(state: GameState): OverlayViewModel {
  const clearSec = getStageClearTimeSec(state);
  return {
    scene: state.scene,
    score: state.score,
    lives: state.lives,
    clearTime: state.scene === "clear" ? formatTime(state.elapsedSec) : undefined,
    errorMessage: state.errorMessage ?? undefined,
    stageLabel: `ステージ ${state.campaign.stageIndex + 1} / ${state.campaign.totalStages}`,
    stageResult:
      typeof state.stageStats.starRating === "number" &&
      typeof state.stageStats.ratingScore === "number" &&
      clearSec !== null
        ? {
            stars: state.stageStats.starRating,
            ratingScore: state.stageStats.ratingScore,
            clearTime: formatTime(clearSec),
            hitsTaken: state.stageStats.hitsTaken,
            livesLeft: state.lives,
            missionTargetTime: formatTime(state.stageStats.missionTargetSec),
            missionAchieved: state.stageStats.missionAchieved ?? false,
          }
        : undefined,
    campaignResults:
      state.scene === "clear"
        ? state.campaign.results.map((result) => ({
            stageNumber: result.stageNumber,
            stars: result.stars,
            ratingScore: result.ratingScore,
            clearTime: formatTime(result.clearTimeSec),
            livesLeft: result.livesAtClear,
            missionTargetTime: formatTime(result.missionTargetSec),
            missionAchieved: result.missionAchieved,
          }))
        : undefined,
    rogueOffer:
      state.scene === "stageclear" && state.rogue.pendingOffer
        ? {
            options: state.rogue.pendingOffer,
            remaining: Math.max(0, ROGUE_CONFIG.maxUpgrades - state.rogue.upgradesTaken),
          }
        : undefined,
    storyText:
      state.scene === "story" && typeof state.story.activeStageNumber === "number"
        ? (getStageStory(state.story.activeStageNumber) ?? undefined)
        : undefined,
  };
}

const COMBO_ACTIVE_COLOR = "#ffd46b";

function buildAccessibilityBadge(state: GameState): string {
  const flags: string[] = [];
  if (state.a11y.reducedMotion) {
    flags.push("動き抑制");
  }
  if (state.a11y.highContrast) {
    flags.push("高コントラスト");
  }
  return flags.length > 0 ? `表示: ${flags.join(" / ")}` : "表示: 標準";
}
