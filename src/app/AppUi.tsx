import { type CSSProperties, type ReactElement, useEffect, useMemo, useRef } from "react";
import { getDailyChallenge } from "../game/dailyChallenge";
import type { OverlayViewModel, StageResultSummaryView, StageResultView } from "../game/renderTypes";
import type { Scene } from "../game/types";
import { useAppStore } from "./store";

interface OverlayCopy {
  message: string;
  sub: string;
  button: string;
}

const OVERLAY_COPY: Record<Scene, OverlayCopy> = {
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

export function AppUi(): ReactElement {
  const hud = useAppStore((state) => state.hud);
  const overlay = useAppStore((state) => state.overlay.model);
  const shop = useAppStore((state) => state.shop);
  const startSettings = useAppStore((state) => state.startSettings);
  const rogueSelection = useAppStore((state) => state.rogueSelection);
  const setStartSettings = useAppStore((state) => state.setStartSettings);
  const setRogueSelection = useAppStore((state) => state.setRogueSelection);
  const triggerPrimaryAction = useAppStore((state) => state.triggerPrimaryAction);
  const triggerShopOption = useAppStore((state) => state.triggerShopOption);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const lastScoreRef = useRef(0);
  const copy = OVERLAY_COPY[overlay.scene];
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);

  useEffect(() => {
    const element = scoreRef.current;
    if (!element) {
      lastScoreRef.current = overlay.score;
      return;
    }
    const gain = overlay.score - lastScoreRef.current;
    if (gain > 0) {
      element.classList.remove("pop", "pop-large");
      void element.offsetWidth;
      element.classList.add("pop");
      if (gain >= 300) {
        element.classList.add("pop-large");
      }
      lastScoreRef.current = overlay.score;
      const timer = setTimeout(() => {
        element.classList.remove("pop", "pop-large");
      }, 130);
      return () => {
        clearTimeout(timer);
      };
    }
    lastScoreRef.current = overlay.score;
    return undefined;
  }, [overlay.score]);

  const overlaySubText = buildOverlaySubText(copy.sub, overlay);

  return (
    <>
      <div id="hud" aria-live="polite" style={{ "--hud-accent": hud.accentColor } as CSSProperties}>
        <span id="score" ref={scoreRef}>
          {hud.scoreText}
        </span>
        <span id="lives">{hud.livesText}</span>
        <span id="time">{hud.timeText}</span>
        <span id="stage">{hud.stageText}</span>
        <span id="combo">{hud.comboText}</span>
        <span id="a11y-badge">{hud.accessibilityText}</span>
        <span id="items">{hud.itemsText}</span>
      </div>

      <div
        id="overlay"
        data-scene={overlay.scene}
        className={overlay.scene === "playing" ? "overlay hidden" : "overlay"}
      >
        <div className="card">
          <h1>Brick Breaker</h1>
          <p id="overlay-message">{copy.message}</p>
          <p id="overlay-sub" className="subtle">
            {overlaySubText}
          </p>

          {overlay.scene === "start" ? (
            <div id="start-settings" className="start-settings">
              <label>
                難易度
                <select
                  id="setting-difficulty"
                  value={startSettings.difficulty}
                  onChange={(event) => {
                    setStartSettings({ difficulty: event.target.value as typeof startSettings.difficulty });
                  }}
                >
                  <option value="casual">カジュアル</option>
                  <option value="standard">スタンダード</option>
                  <option value="hard">ハード</option>
                </select>
              </label>
              <label>
                初期残機
                <select
                  id="setting-lives"
                  value={String(startSettings.initialLives)}
                  onChange={(event) => {
                    setStartSettings({ initialLives: Number.parseInt(event.target.value, 10) || 4 });
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((lives) => (
                    <option key={lives} value={lives}>
                      {lives}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                速度
                <select
                  id="setting-speed"
                  value={startSettings.speedPreset}
                  onChange={(event) => {
                    setStartSettings({ speedPreset: event.target.value as typeof startSettings.speedPreset });
                  }}
                >
                  <option value="0.75">75%</option>
                  <option value="1.00">100%</option>
                  <option value="1.25">125%</option>
                </select>
              </label>
              <label>
                ルート選択
                <select
                  id="setting-route"
                  value={startSettings.routePreference}
                  onChange={(event) => {
                    setStartSettings({
                      routePreference: event.target.value as typeof startSettings.routePreference,
                    });
                  }}
                >
                  <option value="auto">自動</option>
                  <option value="A">Aルート</option>
                  <option value="B">Bルート</option>
                </select>
              </label>
              <label>
                マルチ上限
                <select
                  id="setting-multiball-max"
                  value={String(startSettings.multiballMaxBalls)}
                  onChange={(event) => {
                    setStartSettings({ multiballMaxBalls: Number.parseInt(event.target.value, 10) || 4 });
                  }}
                >
                  {[2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle-row">
                <span>チャレンジ固定シード</span>
                <input
                  id="setting-challenge-mode"
                  type="checkbox"
                  checked={startSettings.challengeMode}
                  onChange={(event) => {
                    setStartSettings({ challengeMode: event.target.checked });
                  }}
                />
              </label>
              <label className="toggle-row">
                <span>デイリーモード</span>
                <input
                  id="setting-daily-mode"
                  type="checkbox"
                  checked={startSettings.dailyMode}
                  onChange={(event) => {
                    setStartSettings({ dailyMode: event.target.checked });
                  }}
                />
              </label>
              <label className="toggle-row">
                <span>リスク倍率モード</span>
                <input
                  id="setting-risk-mode"
                  type="checkbox"
                  checked={startSettings.riskMode}
                  onChange={(event) => {
                    setStartSettings({ riskMode: event.target.checked });
                  }}
                />
              </label>
              <label className="toggle-row">
                <span>BGM</span>
                <input
                  id="setting-bgm-enabled"
                  type="checkbox"
                  checked={startSettings.bgmEnabled}
                  onChange={(event) => {
                    setStartSettings({ bgmEnabled: event.target.checked });
                  }}
                />
              </label>
              <label className="toggle-row">
                <span>効果音</span>
                <input
                  id="setting-sfx-enabled"
                  type="checkbox"
                  checked={startSettings.sfxEnabled}
                  onChange={(event) => {
                    setStartSettings({ sfxEnabled: event.target.checked });
                  }}
                />
              </label>
            </div>
          ) : null}

          {overlay.scene === "start" ? (
            <p id="daily-challenge-label" className="subtle">
              今日のデイリー({dailyChallenge.key}): {dailyChallenge.objective}
            </p>
          ) : null}

          {overlay.scene === "clear" ? (
            <div id="overlay-results-section" className="results-section">
              <p className="subtle">ステージ別結果</p>
              <ul id="overlay-results">{renderCampaignResults(overlay.campaignResults ?? [])}</ul>
            </div>
          ) : (
            <div id="overlay-results-section" className="results-section panel-hidden">
              <ul id="overlay-results" />
            </div>
          )}

          {overlay.scene === "stageclear" && overlay.rogueOffer ? (
            <div id="overlay-rogue-section" className="results-section">
              <p className="subtle">ラン強化（3回まで）</p>
              <select
                id="overlay-rogue-select"
                value={rogueSelection}
                onChange={(event) => {
                  setRogueSelection(event.target.value as typeof rogueSelection);
                }}
              >
                {overlay.rogueOffer.options.map((option) => (
                  <option key={option} value={option}>
                    {formatRogueUpgradeLabel(option)}（残り{overlay.rogueOffer?.remaining ?? 0}回）
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div id="overlay-rogue-section" className="results-section panel-hidden">
              <select id="overlay-rogue-select" />
            </div>
          )}

          <button id="overlay-button" type="button" onClick={triggerPrimaryAction}>
            {copy.button}
          </button>
          <p className="subtle">Pキーで一時停止</p>
        </div>
      </div>

      <div id="shop-panel" className={shop.visible ? "shop-panel" : "shop-panel panel-hidden"}>
        <p id="shop-status">{shop.status}</p>
        <div className="shop-buttons">
          <button
            id="shop-option-a"
            type="button"
            disabled={shop.optionADisabled}
            onClick={() => {
              triggerShopOption(0);
            }}
          >
            {shop.optionALabel}
          </button>
          <button
            id="shop-option-b"
            type="button"
            disabled={shop.optionBDisabled}
            onClick={() => {
              triggerShopOption(1);
            }}
          >
            {shop.optionBLabel}
          </button>
        </div>
      </div>
    </>
  );
}

function buildOverlaySubText(copySub: string, overlay: OverlayViewModel): string {
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

function formatStageResult(stageResult: StageResultView | undefined): string {
  if (!stageResult) {
    return "";
  }
  const stars = "★".repeat(stageResult.stars);
  const missionText = stageResult.missionAchieved ? "達成" : "未達";
  return ` / 評価 ${stars} (${stageResult.ratingScore}) ・時間 ${stageResult.clearTime} ・被弾 ${stageResult.hitsTaken} ・残機 ${stageResult.livesLeft} ・ミッション 制限時間 ${stageResult.missionTargetTime} 以内: ${missionText}`;
}

function renderCampaignResults(results: StageResultSummaryView[]): ReactElement[] {
  if (results.length <= 0) {
    return [<li key="empty">結果データがありません。</li>];
  }

  return results.map((result) => {
    const stars = "★".repeat(result.stars);
    const missionText = result.missionAchieved ? "達成" : "未達";
    return (
      <li key={`stage-${result.stageNumber}`}>
        ステージ {result.stageNumber}: {stars} ({result.ratingScore}) / 時間 {result.clearTime} / 残機{" "}
        {result.livesLeft} / ミッション {result.missionTargetTime} 以内: {missionText}
      </li>
    );
  });
}

function formatRogueUpgradeLabel(upgrade: "paddle_core" | "speed_core" | "score_core"): string {
  if (upgrade === "paddle_core") {
    return "幅コア";
  }
  if (upgrade === "speed_core") {
    return "速度コア";
  }
  return "スコアコア";
}
