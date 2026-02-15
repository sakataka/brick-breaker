import type { ReactElement } from "react";
import type { StartSettingsSelection } from "../store";

export interface StartSettingsFormProps {
  settings: StartSettingsSelection;
  onChange: (patch: Partial<StartSettingsSelection>) => void;
}

export function StartSettingsForm({ settings, onChange }: StartSettingsFormProps): ReactElement {
  return (
    <div id="start-settings" className="start-settings">
      <section className="settings-section basic-settings">
        <p className="settings-section-title">基本設定</p>
        <label>
          難易度
          <select
            id="setting-difficulty"
            value={settings.difficulty}
            onChange={(event) => {
              onChange({ difficulty: event.target.value as typeof settings.difficulty });
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
            value={String(settings.initialLives)}
            onChange={(event) => {
              onChange({ initialLives: Number.parseInt(event.target.value, 10) || 4 });
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
            value={settings.speedPreset}
            onChange={(event) => {
              onChange({ speedPreset: event.target.value as typeof settings.speedPreset });
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
            value={settings.routePreference}
            onChange={(event) => {
              onChange({
                routePreference: event.target.value as typeof settings.routePreference,
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
            value={String(settings.multiballMaxBalls)}
            onChange={(event) => {
              onChange({ multiballMaxBalls: Number.parseInt(event.target.value, 10) || 4 });
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
            checked={settings.challengeMode}
            onChange={(event) => {
              onChange({ challengeMode: event.target.checked });
            }}
          />
        </label>
        <label className="toggle-row">
          <span>デイリーモード</span>
          <input
            id="setting-daily-mode"
            type="checkbox"
            checked={settings.dailyMode}
            onChange={(event) => {
              onChange({ dailyMode: event.target.checked });
            }}
          />
        </label>
        <label className="toggle-row">
          <span>リスク倍率モード</span>
          <input
            id="setting-risk-mode"
            type="checkbox"
            checked={settings.riskMode}
            onChange={(event) => {
              onChange({ riskMode: event.target.checked });
            }}
          />
        </label>
        <label className="toggle-row">
          <span>新アイテムのスタック</span>
          <input
            id="setting-new-item-stacks"
            type="checkbox"
            checked={settings.enableNewItemStacks}
            onChange={(event) => {
              onChange({ enableNewItemStacks: event.target.checked });
            }}
          />
        </label>
        <label className="toggle-row">
          <span>Stickyアイテム有効</span>
          <input
            id="setting-sticky-item-enabled"
            type="checkbox"
            checked={settings.stickyItemEnabled}
            onChange={(event) => {
              onChange({ stickyItemEnabled: event.target.checked });
            }}
          />
        </label>
        <label className="toggle-row">
          <span>BGM</span>
          <input
            id="setting-bgm-enabled"
            type="checkbox"
            checked={settings.bgmEnabled}
            onChange={(event) => {
              onChange({ bgmEnabled: event.target.checked });
            }}
          />
        </label>
        <label className="toggle-row">
          <span>効果音</span>
          <input
            id="setting-sfx-enabled"
            type="checkbox"
            checked={settings.sfxEnabled}
            onChange={(event) => {
              onChange({ sfxEnabled: event.target.checked });
            }}
          />
        </label>
      </section>

      <section
        className={`settings-section debug-settings${settings.debugModeEnabled ? " debug-section-open" : ""}`}
      >
        <div className="settings-section-title-row">
          <p className="settings-section-title">デバッグ設定</p>
          <label className="toggle-row compact-toggle">
            <span>有効化</span>
            <input
              id="setting-debug-mode"
              type="checkbox"
              checked={settings.debugModeEnabled}
              onChange={(event) => {
                onChange({ debugModeEnabled: event.target.checked });
              }}
            />
          </label>
        </div>

        {settings.debugModeEnabled ? (
          <>
            <label>
              開始ステージ
              <select
                id="setting-debug-start-stage"
                value={String(settings.debugStartStage)}
                onChange={(event) => {
                  onChange({
                    debugStartStage: Number.parseInt(event.target.value, 10) || 1,
                  });
                }}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <label>
              シナリオ
              <select
                id="setting-debug-scenario"
                value={settings.debugScenario}
                onChange={(event) => {
                  onChange({
                    debugScenario: event.target.value as typeof settings.debugScenario,
                  });
                }}
              >
                <option value="normal">通常</option>
                <option value="enemy_check">敵確認（9面）</option>
                <option value="boss_check">ボス確認（12面）</option>
              </select>
            </label>
            <label>
              アイテムプリセット
              <select
                id="setting-debug-item-preset"
                value={settings.debugItemPreset}
                onChange={(event) => {
                  onChange({
                    debugItemPreset: event.target.value as typeof settings.debugItemPreset,
                  });
                }}
              >
                <option value="none">なし</option>
                <option value="combat_check">戦闘確認</option>
                <option value="boss_check">ボス確認</option>
              </select>
            </label>
            <label>
              結果記録
              <select
                id="setting-debug-record-results"
                value={settings.debugRecordResults ? "true" : "false"}
                onChange={(event) => {
                  onChange({
                    debugRecordResults: event.target.value === "true",
                  });
                }}
              >
                <option value="false">記録しない</option>
                <option value="true">記録する</option>
              </select>
            </label>
          </>
        ) : (
          <p className="settings-section-note">デバッグモードをONにすると検証用オプションを表示します。</p>
        )}
      </section>
    </div>
  );
}
