import type { ReactElement } from "react";
import { STAGE_CATALOG } from "../../game/config";
import { START_SETTINGS_OPTIONS, type StartSettingsSelection } from "../store";

export interface StartSettingsFormProps {
  settings: StartSettingsSelection;
  onChange: (patch: Partial<StartSettingsSelection>) => void;
}

export function StartSettingsForm({ settings, onChange }: StartSettingsFormProps): ReactElement {
  const basicSelectRows: Array<{
    id: string;
    label: string;
    value: string;
    options: ReadonlyArray<{ value: string | number; label: string }>;
    patch: (value: string) => Partial<StartSettingsSelection>;
  }> = [
    {
      id: "setting-mode",
      label: "モード",
      value: settings.gameMode,
      options: START_SETTINGS_OPTIONS.gameMode,
      patch: (value) => ({ gameMode: value as StartSettingsSelection["gameMode"] }),
    },
    {
      id: "setting-difficulty",
      label: "難易度",
      value: settings.difficulty,
      options: START_SETTINGS_OPTIONS.difficulty,
      patch: (value) => ({ difficulty: value as StartSettingsSelection["difficulty"] }),
    },
    {
      id: "setting-lives",
      label: "初期残機",
      value: String(settings.initialLives),
      options: START_SETTINGS_OPTIONS.initialLives,
      patch: (value) => ({ initialLives: Number.parseInt(value, 10) || 4 }),
    },
    {
      id: "setting-speed",
      label: "速度",
      value: settings.speedPreset,
      options: START_SETTINGS_OPTIONS.speedPreset,
      patch: (value) => ({ speedPreset: value as StartSettingsSelection["speedPreset"] }),
    },
    {
      id: "setting-route",
      label: "ルート選択",
      value: settings.routePreference,
      options: START_SETTINGS_OPTIONS.routePreference,
      patch: (value) => ({ routePreference: value as StartSettingsSelection["routePreference"] }),
    },
    {
      id: "setting-multiball-max",
      label: "マルチ上限",
      value: String(settings.multiballMaxBalls),
      options: START_SETTINGS_OPTIONS.multiballMaxBalls,
      patch: (value) => ({ multiballMaxBalls: Number.parseInt(value, 10) || 4 }),
    },
  ];

  const basicToggleRows: Array<{
    id: string;
    label: string;
    checked: boolean;
    patch: (checked: boolean) => Partial<StartSettingsSelection>;
  }> = [
    {
      id: "setting-challenge-mode",
      label: "チャレンジ固定シード",
      checked: settings.challengeMode,
      patch: (checked) => ({ challengeMode: checked }),
    },
    {
      id: "setting-daily-mode",
      label: "デイリーモード",
      checked: settings.dailyMode,
      patch: (checked) => ({ dailyMode: checked }),
    },
    {
      id: "setting-risk-mode",
      label: "リスク倍率モード",
      checked: settings.riskMode,
      patch: (checked) => ({ riskMode: checked }),
    },
    {
      id: "setting-new-item-stacks",
      label: "新アイテムのスタック",
      checked: settings.enableNewItemStacks,
      patch: (checked) => ({ enableNewItemStacks: checked }),
    },
    {
      id: "setting-sticky-item-enabled",
      label: "Stickyアイテム有効",
      checked: settings.stickyItemEnabled,
      patch: (checked) => ({ stickyItemEnabled: checked }),
    },
    {
      id: "setting-ghost-replay-enabled",
      label: "ゴースト再生",
      checked: settings.ghostReplayEnabled,
      patch: (checked) => ({ ghostReplayEnabled: checked }),
    },
    {
      id: "setting-bgm-enabled",
      label: "BGM",
      checked: settings.bgmEnabled,
      patch: (checked) => ({ bgmEnabled: checked }),
    },
    {
      id: "setting-sfx-enabled",
      label: "効果音",
      checked: settings.sfxEnabled,
      patch: (checked) => ({ sfxEnabled: checked }),
    },
  ];

  const debugSelectRows: Array<{
    id: string;
    label: string;
    value: string;
    options: ReadonlyArray<{ value: string | number; label: string }>;
    patch: (value: string) => Partial<StartSettingsSelection>;
  }> = [
    {
      id: "setting-debug-start-stage",
      label: "開始ステージ",
      value: String(settings.debugStartStage),
      options: START_SETTINGS_OPTIONS.debugStartStage,
      patch: (value) => ({ debugStartStage: Number.parseInt(value, 10) || 1 }),
    },
    {
      id: "setting-debug-scenario",
      label: "シナリオ",
      value: settings.debugScenario,
      options: START_SETTINGS_OPTIONS.debugScenario,
      patch: (value) => ({ debugScenario: value as StartSettingsSelection["debugScenario"] }),
    },
    {
      id: "setting-debug-item-preset",
      label: "アイテムプリセット",
      value: settings.debugItemPreset,
      options: START_SETTINGS_OPTIONS.debugItemPreset,
      patch: (value) => ({ debugItemPreset: value as StartSettingsSelection["debugItemPreset"] }),
    },
    {
      id: "setting-debug-record-results",
      label: "結果記録",
      value: settings.debugRecordResults ? "true" : "false",
      options: START_SETTINGS_OPTIONS.debugRecordResults,
      patch: (value) => ({ debugRecordResults: value === "true" }),
    },
  ];

  return (
    <div id="start-settings" className="start-settings">
      <section className="settings-section basic-settings">
        <p className="settings-section-title">基本設定</p>
        {basicSelectRows.map((row) => (
          <label key={row.id}>
            {row.label}
            <select
              id={row.id}
              value={row.value}
              onChange={(event) => {
                onChange(row.patch(event.target.value));
              }}
            >
              {row.options.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          シードコード（任意）
          <input
            id="setting-seed-code"
            type="text"
            value={settings.challengeSeedCode}
            placeholder="例: C03-BOSS-777"
            onChange={(event) => {
              onChange({ challengeSeedCode: event.target.value.trim() });
            }}
          />
        </label>
        {basicToggleRows.map((row) => (
          <label key={row.id} className="toggle-row">
            <span>{row.label}</span>
            <input
              id={row.id}
              type="checkbox"
              checked={row.checked}
              onChange={(event) => {
                onChange(row.patch(event.target.checked));
              }}
            />
          </label>
        ))}
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
            {debugSelectRows.map((row) => (
              <label key={row.id}>
                {row.label}
                <select
                  id={row.id}
                  value={row.value}
                  onChange={(event) => {
                    onChange(row.patch(event.target.value));
                  }}
                >
                  {row.options.map((option) => (
                    <option key={String(option.value)} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label className="toggle-row">
              <span>カスタムステージJSON</span>
              <input
                id="setting-custom-stage-json-enabled"
                type="checkbox"
                checked={settings.customStageJsonEnabled}
                onChange={(event) => {
                  onChange({ customStageJsonEnabled: event.target.checked });
                }}
              />
            </label>
            {settings.customStageJsonEnabled ? (
              <>
                <label>
                  ステージJSON
                  <textarea
                    id="setting-custom-stage-json"
                    value={settings.customStageJson}
                    placeholder='[{"id":1,"speedScale":1,"layout":[[1,0]],"elite":[]}]'
                    onChange={(event) => {
                      onChange({ customStageJson: event.target.value });
                    }}
                  />
                </label>
                <button
                  id="setting-custom-stage-json-fill"
                  type="button"
                  onClick={() => {
                    onChange({
                      customStageJsonEnabled: true,
                      customStageJson: JSON.stringify(STAGE_CATALOG, null, 2),
                    });
                  }}
                >
                  現在の標準ステージJSONを読み込む
                </button>
              </>
            ) : null}
          </>
        ) : (
          <p className="settings-section-note">デバッグモードをONにすると検証用オプションを表示します。</p>
        )}
      </section>
    </div>
  );
}
