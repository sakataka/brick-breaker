import type { OverlayViewModel, StageResultSummaryView, StageResultView } from "../../game/renderTypes";
import { formatTime } from "../../game/time";
import type { AppLocale, LL } from "../../i18n";
import { formatPoints, getRogueUpgradeLabel, getStageMissionLabel } from "../../i18n";

export function getOverlayMessage(LL: LL, scene: OverlayViewModel["scene"]): string {
  return LL.overlay.message[scene]();
}

export function getOverlayButton(LL: LL, scene: OverlayViewModel["scene"]): string {
  switch (scene) {
    case "start":
      return LL.actions.start();
    case "story":
      return LL.actions.continue();
    case "paused":
      return LL.actions.resume();
    case "gameover":
      return LL.actions.retry();
    case "clear":
      return LL.actions.backToTitle();
    case "stageclear":
      return LL.actions.next();
    case "error":
      return LL.actions.reload();
    default:
      return "";
  }
}

export function buildStageLabel(LL: LL, overlay: OverlayViewModel): string {
  const modeLabel = LL.hud.stageMode[overlay.stage.mode]();
  const counter =
    overlay.stage.mode === "endless"
      ? LL.hud.endlessStageCounter({ current: overlay.stage.current })
      : LL.hud.stageCounter({ current: overlay.stage.current, total: overlay.stage.total });
  const debugPrefix = overlay.stage.debugModeEnabled
    ? `[${overlay.stage.debugRecordResults ? LL.hud.debug.badgeOn() : LL.hud.debug.badgeOff()}] `
    : "";
  return `${debugPrefix}${modeLabel} ${counter}`;
}

export function buildOverlaySubText(locale: AppLocale, LL: LL, overlay: OverlayViewModel): string {
  if (overlay.scene === "gameover") {
    return LL.overlay.sub.gameover({
      score: overlay.score,
      lives: overlay.lives,
    });
  }
  if (overlay.scene === "clear") {
    return buildClearSummary(locale, LL, overlay);
  }
  if (overlay.scene === "stageclear") {
    return buildStageClearSummary(locale, LL, overlay);
  }
  if (overlay.scene === "error") {
    return buildErrorText(LL, overlay);
  }
  if (overlay.scene === "story" && typeof overlay.storyStageNumber === "number") {
    return getStoryText(LL, overlay.storyStageNumber);
  }
  if (overlay.scene === "playing") {
    return "";
  }
  return LL.overlay.sub[overlay.scene]();
}

export function buildCampaignResultRows(LL: LL, results: StageResultSummaryView[]): string[] {
  if (results.length <= 0) {
    return [LL.overlay.noResults()];
  }

  return results.map((result) =>
    LL.results.summaryRow({
      stageNumber: result.stageNumber,
      stars: "★".repeat(result.stars),
      ratingScore: result.ratingScore,
      clearTime: formatTime(result.clearTimeSec),
      livesLeft: result.livesLeft,
      missionSummary: formatMissionSummary(LL, result.missionResults),
    }),
  );
}

export function formatRogueUpgradeLabel(
  LL: LL,
  upgrade: "paddle_core" | "speed_core" | "score_core",
): string {
  return getRogueUpgradeLabel(LL, upgrade);
}

export function formatMissionSummary(LL: LL, missions: StageResultView["missionResults"]): string {
  if (!missions || missions.length === 0) {
    return "-";
  }
  return missions
    .map((mission) => {
      const label = getStageMissionLabel(LL, mission.key);
      const target =
        typeof mission.targetSec === "number"
          ? `(${LL.stageMission.targetSeconds({ seconds: mission.targetSec })})`
          : "";
      const status = mission.achieved ? LL.stageMission.achieved() : LL.stageMission.failed();
      return `${label}${target}:${status}`;
    })
    .join(" / ");
}

export function getStoryText(LL: LL, stageNumber: number): string {
  if (stageNumber === 4) {
    return LL.story.stage4();
  }
  if (stageNumber === 8) {
    return LL.story.stage8();
  }
  return LL.story.stage12();
}

function buildClearSummary(locale: AppLocale, LL: LL, overlay: OverlayViewModel): string {
  const timeText =
    typeof overlay.clearElapsedSec === "number"
      ? ` / ${LL.results.time()} ${formatTime(overlay.clearElapsedSec)}`
      : "";
  return `${buildStageLabel(LL, overlay)} ${formatPoints(locale, overlay.score)}${timeText}`.trim();
}

function buildStageClearSummary(locale: AppLocale, LL: LL, overlay: OverlayViewModel): string {
  if (!overlay.stageResult) {
    return `${buildStageLabel(LL, overlay)} ${formatPoints(locale, overlay.score)}`;
  }
  return LL.overlay.sub.stageclearSummary({
    stageLabel: buildStageLabel(LL, overlay),
    score: overlay.score,
    stars: "★".repeat(overlay.stageResult.stars),
    ratingScore: overlay.stageResult.ratingScore,
    clearTime: formatTime(overlay.stageResult.clearTimeSec),
    hitsTaken: overlay.stageResult.hitsTaken,
    livesLeft: overlay.stageResult.livesLeft,
    missionSummary: formatMissionSummary(LL, overlay.stageResult.missionResults),
  });
}

function buildErrorText(LL: LL, overlay: OverlayViewModel): string {
  if (!overlay.error) {
    return LL.overlay.sub.error();
  }
  const base = LL.errors[overlay.error.key]();
  return overlay.error.detail ? `${base} (${overlay.error.detail})` : base;
}
