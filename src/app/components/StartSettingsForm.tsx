import type { ReactElement } from "react";
import { STAGE_CATALOG } from "../../game/config";
import { type AppLocale, getLL, supportedLocales } from "../../i18n";
import { START_SETTINGS_OPTIONS, type StartSettingsSelection } from "../store";

export interface StartSettingsFormProps {
  locale: AppLocale;
  settings: StartSettingsSelection;
  onChange: (patch: Partial<StartSettingsSelection>) => void;
  onLocaleChange: (locale: AppLocale) => void;
}

export function StartSettingsForm({
  locale,
  settings,
  onChange,
  onLocaleChange,
}: StartSettingsFormProps): ReactElement {
  const LL = getLL(locale);
  const basicSelectRows: Array<{
    id: string;
    label: string;
    value: string;
    options: ReadonlyArray<{ value: string | number; label: string }>;
    patch: (value: string) => Partial<StartSettingsSelection>;
  }> = [
    {
      id: "setting-mode",
      label: LL.startSettings.fields.mode(),
      value: settings.gameMode,
      options: START_SETTINGS_OPTIONS.gameMode.map((option) => ({
        value: option.value,
        label: LL.startSettings.values.gameMode[option.value](),
      })),
      patch: (value) => ({ gameMode: value as StartSettingsSelection["gameMode"] }),
    },
    {
      id: "setting-difficulty",
      label: LL.startSettings.fields.difficulty(),
      value: settings.difficulty,
      options: START_SETTINGS_OPTIONS.difficulty.map((option) => ({
        value: option.value,
        label: LL.startSettings.values.difficulty[option.value](),
      })),
      patch: (value) => ({ difficulty: value as StartSettingsSelection["difficulty"] }),
    },
    {
      id: "setting-lives",
      label: LL.startSettings.fields.initialLives(),
      value: String(settings.initialLives),
      options: START_SETTINGS_OPTIONS.initialLives.map((option) => ({
        value: option.value,
        label: String(option.value),
      })),
      patch: (value) => ({ initialLives: Number.parseInt(value, 10) || 4 }),
    },
    {
      id: "setting-speed",
      label: LL.startSettings.fields.speed(),
      value: settings.speedPreset,
      options: START_SETTINGS_OPTIONS.speedPreset.map((option) => ({
        value: option.value,
        label: String(option.value),
      })),
      patch: (value) => ({ speedPreset: value as StartSettingsSelection["speedPreset"] }),
    },
    {
      id: "setting-route",
      label: LL.startSettings.fields.route(),
      value: settings.routePreference,
      options: START_SETTINGS_OPTIONS.routePreference.map((option) => ({
        value: option.value,
        label: LL.startSettings.values.routePreference[option.value](),
      })),
      patch: (value) => ({ routePreference: value as StartSettingsSelection["routePreference"] }),
    },
    {
      id: "setting-multiball-max",
      label: LL.startSettings.fields.multiballMax(),
      value: String(settings.multiballMaxBalls),
      options: START_SETTINGS_OPTIONS.multiballMaxBalls.map((option) => ({
        value: option.value,
        label: String(option.value),
      })),
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
      label: LL.startSettings.fields.challengeMode(),
      checked: settings.challengeMode,
      patch: (checked) => ({ challengeMode: checked }),
    },
    {
      id: "setting-daily-mode",
      label: LL.startSettings.fields.dailyMode(),
      checked: settings.dailyMode,
      patch: (checked) => ({ dailyMode: checked }),
    },
    {
      id: "setting-risk-mode",
      label: LL.startSettings.fields.riskMode(),
      checked: settings.riskMode,
      patch: (checked) => ({ riskMode: checked }),
    },
    {
      id: "setting-new-item-stacks",
      label: LL.startSettings.fields.newItemStacks(),
      checked: settings.enableNewItemStacks,
      patch: (checked) => ({ enableNewItemStacks: checked }),
    },
    {
      id: "setting-sticky-item-enabled",
      label: LL.startSettings.fields.stickyItem(),
      checked: settings.stickyItemEnabled,
      patch: (checked) => ({ stickyItemEnabled: checked }),
    },
    {
      id: "setting-ghost-replay-enabled",
      label: LL.startSettings.fields.ghostReplay(),
      checked: settings.ghostReplayEnabled,
      patch: (checked) => ({ ghostReplayEnabled: checked }),
    },
    {
      id: "setting-bgm-enabled",
      label: LL.startSettings.fields.bgm(),
      checked: settings.bgmEnabled,
      patch: (checked) => ({ bgmEnabled: checked }),
    },
    {
      id: "setting-sfx-enabled",
      label: LL.startSettings.fields.sfx(),
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
      label: LL.startSettings.fields.debugStartStage(),
      value: String(settings.debugStartStage),
      options: START_SETTINGS_OPTIONS.debugStartStage.map((option) => ({
        value: option.value,
        label: String(option.value),
      })),
      patch: (value) => ({ debugStartStage: Number.parseInt(value, 10) || 1 }),
    },
    {
      id: "setting-debug-scenario",
      label: LL.startSettings.fields.debugScenario(),
      value: settings.debugScenario,
      options: START_SETTINGS_OPTIONS.debugScenario.map((option) => ({
        value: option.value,
        label: LL.startSettings.values.debugScenario[option.value](),
      })),
      patch: (value) => ({ debugScenario: value as StartSettingsSelection["debugScenario"] }),
    },
    {
      id: "setting-debug-item-preset",
      label: LL.startSettings.fields.debugItemPreset(),
      value: settings.debugItemPreset,
      options: START_SETTINGS_OPTIONS.debugItemPreset.map((option) => ({
        value: option.value,
        label: LL.startSettings.values.debugItemPreset[option.value](),
      })),
      patch: (value) => ({ debugItemPreset: value as StartSettingsSelection["debugItemPreset"] }),
    },
    {
      id: "setting-debug-record-results",
      label: LL.startSettings.fields.debugRecordResults(),
      value: settings.debugRecordResults ? "true" : "false",
      options: START_SETTINGS_OPTIONS.debugRecordResults.map((option) => ({
        value: option.value,
        label: LL.startSettings.values.debugRecordResults[option.value](),
      })),
      patch: (value) => ({ debugRecordResults: value === "true" }),
    },
  ];

  return (
    <div id="start-settings" className="start-settings">
      <section className="settings-section basic-settings">
        <p className="settings-section-title">{LL.startSettings.sections.basic()}</p>

        <label htmlFor="setting-language">
          <span>{LL.startSettings.fields.language()}</span>
          <select
            id="setting-language"
            value={locale}
            onChange={(event) => {
              onLocaleChange(event.target.value as AppLocale);
            }}
          >
            {supportedLocales.map((value) => (
              <option key={value} value={value}>
                {LL.locales[value]()}
              </option>
            ))}
          </select>
        </label>

        <div className="settings-grid">
          {basicSelectRows.map((row) => (
            <label key={row.id} htmlFor={row.id}>
              <span>{row.label}</span>
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
        </div>

        <label htmlFor="setting-seed-code">
          <span>{LL.startSettings.fields.seedCode()}</span>
          <input
            id="setting-seed-code"
            type="text"
            value={settings.challengeSeedCode}
            placeholder={LL.startSettings.placeholders.seedCode()}
            onChange={(event) => {
              onChange({ challengeSeedCode: event.target.value.trim() });
            }}
          />
        </label>

        <div className="settings-toggle-list">
          {basicToggleRows.map((row) => (
            <label key={row.id} className="toggle-row" htmlFor={row.id}>
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
        </div>
      </section>

      <section
        className={`settings-section debug-settings${settings.debugModeEnabled ? " debug-section-open" : ""}`}
      >
        <div className="settings-section-title-row">
          <p className="settings-section-title">{LL.startSettings.sections.debug()}</p>
          <label className="toggle-row compact-toggle" htmlFor="setting-debug-mode">
            <span>{LL.startSettings.fields.debugEnabled()}</span>
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
            <div className="settings-grid">
              {debugSelectRows.map((row) => (
                <label key={row.id} htmlFor={row.id}>
                  <span>{row.label}</span>
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
            </div>
            <label className="toggle-row" htmlFor="setting-custom-stage-json-enabled">
              <span>{LL.startSettings.fields.customStageJsonEnabled()}</span>
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
                <label htmlFor="setting-custom-stage-json">
                  <span>{LL.startSettings.fields.customStageJson()}</span>
                  <textarea
                    id="setting-custom-stage-json"
                    value={settings.customStageJson}
                    placeholder={LL.startSettings.placeholders.customStageJson()}
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
                  {LL.startSettings.loadDefaultStageJson()}
                </button>
              </>
            ) : null}
          </>
        ) : (
          <p className="settings-section-note">{LL.startSettings.debugNote()}</p>
        )}
      </section>
    </div>
  );
}
