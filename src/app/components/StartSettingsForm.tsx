import type { ReactElement } from "react";
import {
  BASIC_SELECT_FIELDS,
  BASIC_TOGGLE_FIELDS,
  buildStartSettingsPatch,
  DEBUG_SELECT_FIELDS,
  getDefaultCustomStageJson,
  START_SETTINGS_OPTIONS,
  type StartSettingsSelectField,
  type StartSettingsSelection,
  type StartSettingsToggleField,
} from "../../game/startSettingsSchema";
import { type AppLocale, getLL, supportedLocales } from "../../i18n";

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
          {BASIC_SELECT_FIELDS.map((field) => (
            <label key={field.id} htmlFor={field.id}>
              <span>{getSelectFieldLabel(LL, field)}</span>
              <select
                id={field.id}
                value={getSelectFieldValue(settings, field)}
                onChange={(event) => {
                  onChange(buildStartSettingsPatch(field.field, event.target.value));
                }}
              >
                {START_SETTINGS_OPTIONS[field.optionsKey].map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {getSelectOptionLabel(LL, field, option.value)}
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
              onChange(buildStartSettingsPatch("challengeSeedCode", event.target.value));
            }}
          />
        </label>

        <div className="settings-toggle-list">
          {BASIC_TOGGLE_FIELDS.map((field) => (
            <label key={field.id} className="toggle-row" htmlFor={field.id}>
              <span>{getToggleFieldLabel(LL, field)}</span>
              <input
                id={field.id}
                type="checkbox"
                checked={Boolean(settings[field.field])}
                onChange={(event) => {
                  onChange(buildStartSettingsPatch(field.field, event.target.checked));
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
                onChange(buildStartSettingsPatch("debugModeEnabled", event.target.checked));
              }}
            />
          </label>
        </div>

        {settings.debugModeEnabled ? (
          <>
            <div className="settings-grid">
              {DEBUG_SELECT_FIELDS.map((field) => (
                <label key={field.id} htmlFor={field.id}>
                  <span>{getSelectFieldLabel(LL, field)}</span>
                  <select
                    id={field.id}
                    value={getSelectFieldValue(settings, field)}
                    onChange={(event) => {
                      onChange(buildStartSettingsPatch(field.field, event.target.value));
                    }}
                  >
                    {START_SETTINGS_OPTIONS[field.optionsKey].map((option) => (
                      <option key={String(option.value)} value={option.value}>
                        {getSelectOptionLabel(LL, field, option.value)}
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
                  onChange(buildStartSettingsPatch("customStageJsonEnabled", event.target.checked));
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
                      onChange(buildStartSettingsPatch("customStageJson", event.target.value));
                    }}
                  />
                </label>
                <button
                  id="setting-custom-stage-json-fill"
                  type="button"
                  onClick={() => {
                    onChange({
                      customStageJsonEnabled: true,
                      customStageJson: getDefaultCustomStageJson(),
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

function getSelectFieldValue(settings: StartSettingsSelection, field: StartSettingsSelectField): string {
  if (field.field === "debugRecordResults") {
    return settings.debugRecordResults ? "true" : "false";
  }
  return String(settings[field.field]);
}

function getSelectFieldLabel(LL: ReturnType<typeof getLL>, field: StartSettingsSelectField): string {
  switch (field.field) {
    case "gameMode":
      return LL.startSettings.fields.mode();
    case "difficulty":
      return LL.startSettings.fields.difficulty();
    case "initialLives":
      return LL.startSettings.fields.initialLives();
    case "speedPreset":
      return LL.startSettings.fields.speed();
    case "routePreference":
      return LL.startSettings.fields.route();
    case "multiballMaxBalls":
      return LL.startSettings.fields.multiballMax();
    case "debugStartStage":
      return LL.startSettings.fields.debugStartStage();
    case "debugScenario":
      return LL.startSettings.fields.debugScenario();
    case "debugItemPreset":
      return LL.startSettings.fields.debugItemPreset();
    case "debugRecordResults":
      return LL.startSettings.fields.debugRecordResults();
  }
}

function getSelectOptionLabel(
  LL: ReturnType<typeof getLL>,
  field: StartSettingsSelectField,
  value: string | number,
): string {
  switch (field.field) {
    case "gameMode":
      return LL.startSettings.values.gameMode[value as StartSettingsSelection["gameMode"]]();
    case "difficulty":
      return LL.startSettings.values.difficulty[value as StartSettingsSelection["difficulty"]]();
    case "routePreference":
      return LL.startSettings.values.routePreference[value as StartSettingsSelection["routePreference"]]();
    case "debugScenario":
      return LL.startSettings.values.debugScenario[value as StartSettingsSelection["debugScenario"]]();
    case "debugItemPreset":
      return LL.startSettings.values.debugItemPreset[value as StartSettingsSelection["debugItemPreset"]]();
    case "debugRecordResults":
      return LL.startSettings.values.debugRecordResults[value as "false" | "true"]();
    default:
      return String(value);
  }
}

function getToggleFieldLabel(LL: ReturnType<typeof getLL>, field: StartSettingsToggleField): string {
  switch (field.field) {
    case "challengeMode":
      return LL.startSettings.fields.challengeMode();
    case "dailyMode":
      return LL.startSettings.fields.dailyMode();
    case "riskMode":
      return LL.startSettings.fields.riskMode();
    case "enableNewItemStacks":
      return LL.startSettings.fields.newItemStacks();
    case "stickyItemEnabled":
      return LL.startSettings.fields.stickyItem();
    case "ghostReplayEnabled":
      return LL.startSettings.fields.ghostReplay();
    case "bgmEnabled":
      return LL.startSettings.fields.bgm();
    case "sfxEnabled":
      return LL.startSettings.fields.sfx();
    case "debugModeEnabled":
      return LL.startSettings.fields.debugEnabled();
    case "customStageJsonEnabled":
      return LL.startSettings.fields.customStageJsonEnabled();
  }
}
