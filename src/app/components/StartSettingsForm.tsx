import type { CSSProperties, ReactElement } from "react";
import { getStartSettingsItemEntries } from "../../game/itemRegistry";
import {
  BASIC_SELECT_FIELDS,
  BASIC_TOGGLE_FIELDS,
  buildStartSettingsPatch,
  DEBUG_SELECT_FIELDS,
  START_SETTINGS_OPTIONS,
  type StartSettingsSelectField,
  type StartSettingsSelection,
  type StartSettingsToggleField,
  toggleEnabledItem,
} from "../../game/startSettingsSchema";
import { type AppLocale, getItemTranslation, getLL, supportedLocales } from "../../i18n";
import { AppIcon } from "./AppIcon";
import { getItemVisualSpec } from "./itemVisualRegistry";
import { OptionCard, SectionHeader, Surface } from "./uiPrimitives";

export interface StartSettingsFormProps {
  locale: AppLocale;
  settings: StartSettingsSelection;
  exUnlocked: boolean;
  onChange: (patch: Partial<StartSettingsSelection>) => void;
  onLocaleChange: (locale: AppLocale) => void;
}

export function StartSettingsForm({
  locale,
  settings,
  exUnlocked,
  onChange,
  onLocaleChange,
}: StartSettingsFormProps): ReactElement {
  const LL = getLL(locale);

  return (
    <div id="start-settings" className="start-settings">
      <Surface
        className="settings-section basic-settings"
        emphasis="accent"
        chrome="panel"
        elevated
      >
        <SectionHeader
          eyebrow="CAMPAIGN CONFIG"
          title={LL.startSettings.sections.basic()}
          subtitle={
            locale === "ja"
              ? "キャンペーン進行に必要な設定だけを残しています。"
              : "Only campaign-relevant settings remain."
          }
          icon={<AppIcon name="score" weight="fill" />}
        />

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
          {BASIC_SELECT_FIELDS.filter(
            (field) =>
              field.field !== "campaignCourse" || exUnlocked || settings.campaignCourse !== "ex",
          ).map((field) => (
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

        <div className="settings-item-pool" id="setting-item-pool">
          <SectionHeader
            eyebrow="ITEM POOL"
            title={LL.startSettings.sections.itemPool()}
            subtitle={LL.startSettings.itemPoolHint()}
            icon={<AppIcon name="cast" weight="fill" />}
          />
          <div className="item-pool-grid">
            {getStartSettingsItemEntries().map((entry) => {
              const translation = getItemTranslation(LL, entry.type);
              const checked = settings.enabledItems.includes(entry.type);
              const visual = getItemVisualSpec(entry.type);
              return (
                <label key={entry.type} htmlFor={`setting-item-${entry.type}`}>
                  <OptionCard
                    className={`item-pool-card${checked ? " item-pool-card-active" : ""}`}
                    active={checked}
                    accent={visual.accent}
                  >
                    <input
                      id={`setting-item-${entry.type}`}
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        onChange(toggleEnabledItem(settings, entry.type, event.target.checked));
                      }}
                    />
                    <span
                      className="item-pool-icon"
                      style={{ "--item-accent": entry.color } as CSSProperties}
                    >
                      <AppIcon name={visual.icon} size={20} weight="fill" />
                    </span>
                    <span className="item-pool-copy">
                      <strong>{translation.name()}</strong>
                      <small>{translation.description()}</small>
                    </span>
                  </OptionCard>
                </label>
              );
            })}
          </div>
        </div>
      </Surface>

      <Surface
        className={`settings-section debug-settings${settings.debugModeEnabled ? " debug-section-open" : ""}`}
        emphasis="danger"
        chrome="warning"
      >
        <div className="settings-section-title-row">
          <SectionHeader
            eyebrow="DEBUG"
            title={LL.startSettings.sections.debug()}
            subtitle={settings.debugModeEnabled ? undefined : LL.startSettings.debugNote()}
            icon={<AppIcon name="warning" weight="fill" />}
          />
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
        ) : null}
      </Surface>
    </div>
  );
}

function getSelectFieldValue(
  settings: StartSettingsSelection,
  field: StartSettingsSelectField,
): string {
  if (field.field === "debugRecordResults") {
    return settings.debugRecordResults ? "true" : "false";
  }
  return String(settings[field.field]);
}

function getSelectFieldLabel(
  LL: ReturnType<typeof getLL>,
  field: StartSettingsSelectField,
): string {
  switch (field.field) {
    case "campaignCourse":
      return LL.startSettings.fields.campaignCourse();
    case "difficulty":
      return LL.startSettings.fields.difficulty();
    case "initialLives":
      return LL.startSettings.fields.initialLives();
    case "speedPreset":
      return LL.startSettings.fields.speed();
    case "multiballMaxBalls":
      return LL.startSettings.fields.multiballMax();
    case "debugStartStage":
      return LL.startSettings.fields.debugStartStage();
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
    case "campaignCourse":
      return LL.startSettings.values.campaignCourse[
        value as StartSettingsSelection["campaignCourse"]
      ]();
    case "difficulty":
      return LL.startSettings.values.difficulty[value as StartSettingsSelection["difficulty"]]();
    case "debugRecordResults":
      return LL.startSettings.values.debugRecordResults[value as "false" | "true"]();
    default:
      return String(value);
  }
}

function getToggleFieldLabel(
  LL: ReturnType<typeof getLL>,
  field: StartSettingsToggleField,
): string {
  switch (field.field) {
    case "enableNewItemStacks":
      return LL.startSettings.fields.newItemStacks();
    case "bgmEnabled":
      return LL.startSettings.fields.bgm();
    case "sfxEnabled":
      return LL.startSettings.fields.sfx();
    case "debugModeEnabled":
      return LL.startSettings.fields.debugEnabled();
  }
}
