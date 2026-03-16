import type { ReactElement } from "react";
import {
  BASIC_SELECT_FIELDS,
  BASIC_TOGGLE_FIELDS,
  buildStartSettingsPatch,
  START_SETTINGS_OPTIONS,
  type StartSettingsSelectField,
  type StartSettingsSelection,
  type StartSettingsToggleField,
} from "../../game/startSettingsSchema";
import { type AppLocale, getLL, supportedLocales } from "../../i18n";
import { AppIcon } from "./AppIcon";
import { SectionHeader, Surface } from "./uiPrimitives";

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
      <Surface
        className="settings-section basic-settings"
        emphasis="accent"
        chrome="panel"
        elevated
      >
        <SectionHeader
          eyebrow="CAMPAIGN"
          title={LL.startSettings.sections.basic()}
          subtitle={
            locale === "ja"
              ? "ブラウザPC向けの campaign 導線に絞っています。"
              : "The shipped flow is tuned for a browser-first campaign run."
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
          {BASIC_SELECT_FIELDS.map((field) => (
            <label key={field.id} htmlFor={field.id}>
              <span>{getSelectFieldLabel(LL, field)}</span>
              <select
                id={field.id}
                value={String(settings[field.field])}
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
      </Surface>
    </div>
  );
}

function getSelectFieldLabel(
  LL: ReturnType<typeof getLL>,
  field: StartSettingsSelectField,
): string {
  switch (field.field) {
    case "difficulty":
      return LL.startSettings.fields.difficulty();
  }
}

function getSelectOptionLabel(
  LL: ReturnType<typeof getLL>,
  field: StartSettingsSelectField,
  value: string | number,
): string {
  switch (field.field) {
    case "difficulty":
      return LL.startSettings.values.difficulty[value as StartSettingsSelection["difficulty"]]();
  }
}

function getToggleFieldLabel(
  LL: ReturnType<typeof getLL>,
  field: StartSettingsToggleField,
): string {
  switch (field.field) {
    case "reducedMotionEnabled":
      return LL.startSettings.fields.reducedMotion();
    case "highContrastEnabled":
      return LL.startSettings.fields.highContrast();
    case "bgmEnabled":
      return LL.startSettings.fields.bgm();
    case "sfxEnabled":
      return LL.startSettings.fields.sfx();
  }
}
