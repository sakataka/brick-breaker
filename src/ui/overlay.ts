import type { SpeedPreset } from "../game/config";
import { getDailyChallenge } from "../game/dailyChallenge";
import type { RogueOfferView, StageResultSummaryView, StageResultView } from "../game/renderTypes";
import type { Difficulty, RogueUpgradeType, RoutePreference, Scene } from "../game/types";
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
  routePreference: HTMLSelectElement;
  multiballMaxBalls: HTMLSelectElement;
  riskMode: HTMLInputElement;
  challengeMode: HTMLInputElement;
  dailyMode: HTMLInputElement;
  bgmEnabled: HTMLInputElement;
  sfxEnabled: HTMLInputElement;
  dailyChallengeLabel: HTMLParagraphElement;
  rogueSection: HTMLDivElement;
  rogueSelect: HTMLSelectElement;
  resultsSection: HTMLDivElement;
  resultsList: HTMLUListElement;
  shopPanel: HTMLDivElement;
  shopStatus: HTMLParagraphElement;
  shopOptionA: HTMLButtonElement;
  shopOptionB: HTMLButtonElement;
}

export interface StartSettingsSelection {
  difficulty: Difficulty;
  initialLives: number;
  speedPreset: SpeedPreset;
  routePreference: RoutePreference;
  multiballMaxBalls: number;
  riskMode: boolean;
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
  story: {
    message: "ステージ演出",
    sub: "物語テキスト",
    button: "続行",
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
  const routePreference = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#setting-route",
    "setting-route要素が見つかりません",
  );
  const multiballMaxBalls = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#setting-multiball-max",
    "setting-multiball-max要素が見つかりません",
  );
  const riskMode = getRequiredElement<HTMLInputElement>(
    documentRef,
    "#setting-risk-mode",
    "setting-risk-mode要素が見つかりません",
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
  const rogueSection = getRequiredElement<HTMLDivElement>(
    documentRef,
    "#overlay-rogue-section",
    "overlay-rogue-section要素が見つかりません",
  );
  const rogueSelect = getRequiredElement<HTMLSelectElement>(
    documentRef,
    "#overlay-rogue-select",
    "overlay-rogue-select要素が見つかりません",
  );
  const resultsList = getRequiredElement<HTMLUListElement>(
    documentRef,
    "#overlay-results",
    "overlay-results要素が見つかりません",
  );
  const shopPanel = getRequiredElement<HTMLDivElement>(
    documentRef,
    "#shop-panel",
    "shop-panel要素が見つかりません",
  );
  const shopStatus = getRequiredElement<HTMLParagraphElement>(
    documentRef,
    "#shop-status",
    "shop-status要素が見つかりません",
  );
  const shopOptionA = getRequiredElement<HTMLButtonElement>(
    documentRef,
    "#shop-option-a",
    "shop-option-a要素が見つかりません",
  );
  const shopOptionB = getRequiredElement<HTMLButtonElement>(
    documentRef,
    "#shop-option-b",
    "shop-option-b要素が見つかりません",
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
    routePreference,
    multiballMaxBalls,
    riskMode,
    challengeMode,
    dailyMode,
    bgmEnabled,
    sfxEnabled,
    dailyChallengeLabel,
    rogueSection,
    rogueSelect,
    resultsSection,
    resultsList,
    shopPanel,
    shopStatus,
    shopOptionA,
    shopOptionB,
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
    routePreference: parseRoutePreference(elements.routePreference.value),
    multiballMaxBalls: Number.isFinite(multiballMaxBalls) ? multiballMaxBalls : 4,
    riskMode: elements.riskMode.checked,
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
  rogueOffer?: RogueOfferView,
  storyText?: string,
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
  elements.rogueSection.classList.toggle("panel-hidden", !(scene === "stageclear" && rogueOffer));
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
    renderRogueOffer(elements.rogueSelect, rogueOffer);
    elements.sub.textContent = `${stageLabel ?? ""} ${score}点${result}`;
    return;
  }

  if (scene === "story") {
    elements.sub.textContent = storyText ?? copy.sub;
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

function parseRoutePreference(value: string): RoutePreference {
  if (value === "A" || value === "B") {
    return value;
  }
  return "auto";
}

function renderRogueOffer(selectElement: HTMLSelectElement, offer: RogueOfferView | undefined): void {
  selectElement.innerHTML = "";
  if (!offer) {
    return;
  }
  const doc = selectElement.ownerDocument;
  for (const option of offer.options) {
    const item = doc.createElement("option");
    item.value = option;
    item.textContent = `${formatRogueUpgradeLabel(option)}（残り${offer.remaining}回）`;
    selectElement.append(item);
  }
}

function formatRogueUpgradeLabel(upgrade: RogueUpgradeType): string {
  if (upgrade === "paddle_core") {
    return "幅コア";
  }
  if (upgrade === "speed_core") {
    return "速度コア";
  }
  return "スコアコア";
}

export function readRogueUpgradeSelection(elements: OverlayElements): RogueUpgradeType {
  const value = elements.rogueSelect.value;
  if (value === "paddle_core" || value === "speed_core") {
    return value;
  }
  return "score_core";
}
