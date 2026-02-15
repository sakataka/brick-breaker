import type { OverlayViewModel, StageResultSummaryView, StageResultView } from "../../game/renderTypes";

export function buildOverlaySubText(copySub: string, overlay: OverlayViewModel): string {
  if (overlay.scene === "gameover") {
    return `最終スコア ${overlay.score} / 残機 ${overlay.lives}`;
  }
  if (overlay.scene === "clear") {
    return `${overlay.stageLabel ?? ""} ${overlay.score}点 ${
      overlay.clearTime ? `・総時間 ${overlay.clearTime}` : ""
    }`;
  }
  if (overlay.scene === "stageclear") {
    return `${overlay.stageLabel ?? ""} ${overlay.score}点${formatStageResult(overlay.stageResult)}`;
  }
  if (overlay.scene === "error") {
    return overlay.errorMessage ?? copySub;
  }
  if (overlay.scene === "story") {
    return overlay.storyText ?? copySub;
  }
  return copySub;
}

export function formatStageResult(stageResult: StageResultView | undefined): string {
  if (!stageResult) {
    return "";
  }
  const stars = "★".repeat(stageResult.stars);
  const missionText = formatMissionSummary(stageResult.missionResults);
  return ` / 評価 ${stars} (${stageResult.ratingScore}) ・時間 ${stageResult.clearTime} ・被弾 ${stageResult.hitsTaken} ・残機 ${stageResult.livesLeft} ・ミッション ${missionText}`;
}

export function buildCampaignResultRows(results: StageResultSummaryView[]): string[] {
  if (results.length <= 0) {
    return ["結果データがありません。"];
  }

  return results.map((result) => {
    const stars = "★".repeat(result.stars);
    const missionText = formatMissionSummary(result.missionResults);
    return `ステージ ${result.stageNumber}: ${stars} (${result.ratingScore}) / 時間 ${result.clearTime} / 残機 ${result.livesLeft} / ミッション ${missionText}`;
  });
}

export function formatRogueUpgradeLabel(upgrade: "paddle_core" | "speed_core" | "score_core"): string {
  if (upgrade === "paddle_core") {
    return "幅コア";
  }
  if (upgrade === "speed_core") {
    return "速度コア";
  }
  return "スコアコア";
}

function formatMissionSummary(missions: StageResultView["missionResults"]): string {
  if (!missions || missions.length === 0) {
    return "-";
  }
  return missions
    .map(
      (mission) =>
        `${mission.label}${mission.targetText ? `(${mission.targetText})` : ""}:${mission.achieved ? "達成" : "未達"}`,
    )
    .join(" / ");
}
