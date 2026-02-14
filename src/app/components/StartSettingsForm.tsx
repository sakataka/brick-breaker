import type { ReactElement } from "react";
import type { StartSettingsSelection } from "../store";

export interface StartSettingsFormProps {
  settings: StartSettingsSelection;
  onChange: (patch: Partial<StartSettingsSelection>) => void;
}

export function StartSettingsForm({ settings, onChange }: StartSettingsFormProps): ReactElement {
  return (
    <div id="start-settings" className="start-settings">
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
    </div>
  );
}
