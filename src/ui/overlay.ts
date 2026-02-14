import type { SpeedPreset } from "../game/config";
import { getDailyChallenge } from "../game/dailyChallenge";
import type { StageResultSummaryView, StageResultView } from "../game/renderTypes";
import type { Difficulty, Scene } from "../game/types";
import { getRequiredElement } from "../util/dom";

interface OverlayCopy {
  message: string;
  sub: string;
  button: string;
}

export interface OverlayElements {
  overlay: HTMLDivElement;
  message: HTMLParagraphElement;
  sub: HTMLParagraphElement;
  button: HTMLButtonElement;
  startSettings: HTMLDivElement;
  difficulty: HTMLSelectElement;
  initialLives: HTMLSelectElement;
  speedPreset: HTMLSelectElement;
  multiballMaxBalls: HTMLSelectElement;
  challengeMode: HTMLInputElement;
  dailyMode: HTMLInputElement;
  bgmEnabled: HTMLInputElement;
  sfxEnabled: HTMLInputElement;
  dailyChallengeLabel: HTMLParagraphElement;
  resultsSection: HTMLDivElement;
  resultsList: HTMLUListElement;
}

export interface StartSettingsSelection {
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  multiballMaxBalls: number;
  challengeMode: boolean;
  dailyMode: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export const OVERLAY_COPY: Record<Scene, OverlayCopy> = {
  start: {
    message: "ブロック崩し",
    sub: "マウスでバーを移動してボールをたたき返してください。",
    button: "ゲーム開始",
  },
  paused: {
    message: "一時停止中",
    sub: "Pキーで再開できます。",
    button: "再開",
  },
  gameover: {
    message: "ゲームオーバー",
    sub: "最終スコアを確認して、再開ボタンでリトライできます。",
    button: "もう一度",
  },
  playing: {
    message: "",
    sub: "",
    button: "",
  },
  clear: {
    message: "全ステージクリア！",
    sub: "キャンペーン結果",
    button: "タイトルへ戻る",
  },
  stageclear: {
    message: "ステージクリア！",
    sub: "次のステージへ進みます。",
    button: "次へ",
  },
  error: {
    message: "エラーが発生しました",
    sub: "画面を再読み込みして再開してください。",
    button: "再読み込み",
  },
};

export function getOverlayElements(documentRef: Document): OverlayElements {
  const overlay = getRequiredElement<HTMLDivElement>(documentRef, "#overlay", "overlay要素が見つかりません");
  const message = getRequiredElement<HTMLParagraphElement>(
    documentRef,
    "#overlay-message",
    "overlay-message要素が見つかりません",
  );
  const sub = getRequiredElement<HTMLParagraphElement>(
    documentRef,
    "#overlay-sub",
    "overlay-sub要素が見つかりません",
  );
  const button = getRequiredElement<HTMLButtonElement>(
    documentRef,
    "#overlay-button",
    "overlay-button要素が見つかりません",
  );
  const startSettings = getRequiredElement<HTMLDivElement>(
    documentRef,
    "#start-settings",
    "start-settings要素が見つかりません",
  );
  const difficulty = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#setting-difficulty",
    "setting-difficulty要素が見つかりません",
  );
  const initialLives = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#setting-lives",
    "setting-lives要素が見つかりません",
  );
  const speedPreset = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#setting-speed",
    "setting-speed要素が見つかりません",
  );
  const multiballMaxBalls = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#setting-multiball-max",
    "setting-multiball-max要素が見つかりません",
  );
  const bgmEnabled = getRequiredElement<HTMLInputElement>(
    documentRef,
    "#setting-bgm-enabled",
    "setting-bgm-enabled要素が見つかりません",
  );
  const sfxEnabled = getRequiredElement<HTMLInputElement>(
    documentRef,
    "#setting-sfx-enabled",
    "setting-sfx-enabled要素が見つかりません",
  );
  const dailyMode = getRequiredElement<HTMLInputElement>(
    documentRef,
    "#setting-daily-mode",
    "setting-daily-mode要素が見つかりません",
  );
  const dailyChallengeLabel = getRequiredElement<HTMLParagraphElement>(
    documentRef,
    "#daily-challenge-label",
    "daily-challenge-label要素が見つかりません",
  );
  const challengeMode = getRequiredElement<HTMLInputElement>(
    documentRef,
    "#setting-challenge-mode",
    "setting-challenge-mode要素が見つかりません",
  );
  const resultsSection = getRequiredElement<HTMLDivElement>(
    documentRef,
    "#overlay-results-section",
    "overlay-results-section要素が見つかりません",
  );
  const resultsList = getRequiredElement<HTMLUListElement>(
    documentRef,
    "#overlay-results",
    "overlay-results要素が見つかりません",
  );

  return {
    overlay,
    message,
    sub,
    button,
    startSettings,
    difficulty,
    initialLives,
    speedPreset,
    multiballMaxBalls,
    challengeMode,
    dailyMode,
    bgmEnabled,
    sfxEnabled,
    dailyChallengeLabel,
    resultsSection,
    resultsList,
  };
}

export function readStartSettings(elements: OverlayElements): StartSettingsSelection {
  const difficulty = parseDifficulty(elements.difficulty.value);
  const lives = Number.parseInt(elements.initialLives.value, 10);
  const speedPreset = parseSpeedPreset(elements.speedPreset.value);
  const multiballMaxBalls = Number.parseInt(elements.multiballMaxBalls.value, 10);
  return {
    difficulty,
    initialLives: Number.isFinite(lives) ? lives : 4,
    speedPreset,
    multiballMaxBalls: Number.isFinite(multiballMaxBalls) ? multiballMaxBalls : 4,
    challengeMode: elements.challengeMode.checked,
    dailyMode: elements.dailyMode.checked,
    bgmEnabled: elements.bgmEnabled.checked,
    sfxEnabled: elements.sfxEnabled.checked,
  };
}

export function setSceneUI(
  elements: OverlayElements,
  scene: Scene,
  score: number,
  lives: number,
  clearTime?: string,
  errorMessage?: string,
  stageLabel?: string,
  stageResult?: StageResultView,
  campaignResults?: StageResultSummaryView[],
): void {
  if (scene === "playing") {
    elements.overlay.classList.add("hidden");
    return;
  }

  elements.overlay.classList.remove("hidden");
  elements.overlay.dataset.scene = scene;
  const copy = OVERLAY_COPY[scene];
  elements.message.textContent = copy.message;
  elements.button.textContent = copy.button;
  elements.button.disabled = false;
  elements.startSettings.classList.toggle("panel-hidden", scene !== "start");
  elements.resultsSection.classList.toggle("panel-hidden", scene !== "clear");
  if (scene !== "clear") {
    elements.resultsList.innerHTML = "";
  }

  if (scene === "start") {
    const daily = getDailyChallenge();
    elements.dailyChallengeLabel.textContent = `今日のデイリー(${daily.key}): ${daily.objective}`;
    elements.sub.textContent = copy.sub;
    return;
  }

  if (scene === "gameover") {
    elements.sub.textContent = `最終スコア ${score} / 残機 ${lives}`;
    return;
  }

  if (scene === "clear") {
    elements.sub.textContent = `${stageLabel ?? ""} ${score}点 ${clearTime ? `・総時間 ${clearTime}` : ""}`;
    renderCampaignResults(elements.resultsList, campaignResults ?? []);
    return;
  }

  if (scene === "stageclear") {
    const result = formatStageResult(stageResult);
    elements.sub.textContent = `${stageLabel ?? ""} ${score}点${result}`;
    return;
  }

  if (scene === "error") {
    elements.sub.textContent = errorMessage ?? copy.sub;
    return;
  }

  elements.sub.textContent = copy.sub;
}

function formatStageResult(stageResult: StageResultView | undefined): string {
  if (!stageResult) {
    return "";
  }
  const stars = "★".repeat(stageResult.stars);
  const missionText = stageResult.missionAchieved ? "達成" : "未達";
  return ` / 評価 ${stars} (${stageResult.ratingScore}) ・時間 ${stageResult.clearTime} ・被弾 ${stageResult.hitsTaken} ・残機 ${stageResult.livesLeft} ・ミッション 制限時間 ${stageResult.missionTargetTime} 以内: ${missionText}`;
}

function renderCampaignResults(listElement: HTMLUListElement, results: StageResultSummaryView[]): void {
  listElement.innerHTML = "";
  const doc = listElement.ownerDocument;
  if (results.length <= 0) {
    const empty = doc.createElement("li");
    empty.textContent = "結果データがありません。";
    listElement.append(empty);
    return;
  }

  for (const result of results) {
    const item = doc.createElement("li");
    const stars = "★".repeat(result.stars);
    const missionText = result.missionAchieved ? "達成" : "未達";
    item.textContent = `ステージ ${result.stageNumber}: ${stars} (${result.ratingScore}) / 時間 ${result.clearTime} / 残機 ${result.livesLeft} / ミッション ${result.missionTargetTime} 以内: ${missionText}`;
    listElement.append(item);
  }
}

function parseDifficulty(value: string): Difficulty {
  if (value === "casual" || value === "hard") {
    return value;
  }
  return "standard";
}

function parseSpeedPreset(value: string): SpeedPreset {
  if (value === "0.75" || value === "1.25") {
    return value;
  }
  return "1.00";
}
