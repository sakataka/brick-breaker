import type { CSSProperties, ReactElement } from "react";
import type { HudViewModel } from "../../../game-v2/public/renderTypes";
import { getItemTranslation, getLL, type AppLocale } from "../../../i18n";
import { AppIcon } from "../AppIcon";
import { getItemVisualSpec } from "../itemVisualRegistry";
import { DangerPill, IconLabel } from "../uiPrimitives";
import {
  buildLegendTags,
  getBossIntentLabel,
  getPreviewTagLabel,
  getScoreFocusLabel,
  getThreatLabel,
  mapThreatToWarning,
} from "./hudText";

export interface HudStageStatusProps {
  locale: AppLocale;
  hud: HudViewModel;
  stageCounter: string;
}

export function HudStageStatus({ locale, hud, stageCounter }: HudStageStatusProps): ReactElement {
  const LL = getLL(locale);
  const activeItems = hud.activeItems.filter((entry) => entry.count > 0);
  const legendTags = buildLegendTags(locale, hud);

  return (
    <>
      <div className="hud-active-items-rack">
        {activeItems.length > 0 ? (
          activeItems.map((entry) => {
            const visual = getItemVisualSpec(entry.type);
            return (
              <span
                key={`rack-${entry.type}`}
                className="hud-active-item-card"
                style={{ "--item-accent": visual.accent } as CSSProperties}
              >
                <span className="hud-active-item-icon">
                  <AppIcon name={visual.icon} size={16} weight="fill" />
                </span>
                <span className="hud-active-item-copy">
                  <strong>{getItemTranslation(LL, entry.type).short()}</strong>
                  <small>x{entry.count}</small>
                </span>
              </span>
            );
          })
        ) : (
          <span className="hud-active-item-empty">
            {locale === "ja" ? "アイテムなし" : "No active items"}
          </span>
        )}
      </div>
      <div id="stage" className="hud-stage-meta">
        <IconLabel icon={<AppIcon name="warning" className="hud-inline-icon" />}>
          {stageCounter}
        </IconLabel>
        <DangerPill warningLevel={mapThreatToWarning(hud.stage.threatLevel)}>
          {getThreatLabel(locale, hud.stage.threatLevel)}
        </DangerPill>
        <IconLabel icon={<AppIcon name="score" className="hud-inline-icon" />}>
          {getScoreFocusLabel(locale, hud.stage.scoreFocus)}
        </IconLabel>
        {hud.stage.modifierKey ? (
          <IconLabel icon={<AppIcon name="cast" className="hud-inline-icon" />}>
            {LL.hud.modifierValue({ label: LL.stageModifiers[hud.stage.modifierKey]() })}
          </IconLabel>
        ) : null}
      </div>
      <div className="hud-stage-combat">
        {hud.stage.boss ? (
          <div className="hud-stage-combat-row">
            <IconLabel icon={<AppIcon name="boss" className="hud-inline-icon" />}>
              {LL.hud.labels.bossHp()}:{" "}
              {LL.hud.bossValue({
                hp: hud.stage.boss.hp,
                maxHp: hud.stage.boss.maxHp,
                phase: LL.hud.phase({ phase: hud.stage.boss.phase }),
              })}
            </IconLabel>
            {typeof hud.stage.boss.castProgress === "number" ? (
              <IconLabel icon={<AppIcon name="cast" className="hud-inline-icon" />}>
                {LL.hud.labels.cast()} {Math.round(hud.stage.boss.castProgress * 100)}%
              </IconLabel>
            ) : null}
            {hud.stage.boss.intent ? (
              <IconLabel icon={<AppIcon name="warning" className="hud-inline-icon" />}>
                {getBossIntentLabel(LL, hud.stage.boss.intent)}
              </IconLabel>
            ) : null}
            {typeof hud.stage.boss.weakWindowProgress === "number" ? (
              <IconLabel icon={<AppIcon name="cast" className="hud-inline-icon" />}>
                {LL.hud.labels.weakWindow()} {Math.round(hud.stage.boss.weakWindowProgress * 100)}%
              </IconLabel>
            ) : null}
          </div>
        ) : null}
        <div className="hud-stage-combat-row hud-stage-combat-tags">
          {hud.stage.previewTags.map((tag) => (
            <span key={`preview-${tag}`} className="hud-item-tag hud-item-tag-preview">
              {getPreviewTagLabel(locale, tag)}
            </span>
          ))}
          {legendTags.map((segment) => (
            <span key={segment} className="hud-item-tag">
              {segment}
            </span>
          ))}
          {hud.missionProgress.map((mission) => (
            <span key={`mission-${mission.key}`} className="hud-item-tag">
              {mission.achieved ? "✓" : "•"} {LL.stageMission[mission.key]()}
            </span>
          ))}
        </div>
      </div>
      <div id="items" className="hud-item-tags">
        <span className="hud-item-title">{LL.hud.labels.items()}:</span>
        {activeItems.length > 0 ? (
          activeItems.map((entry) => {
            const visual = getItemVisualSpec(entry.type);
            return (
              <span
                key={entry.type}
                className="hud-item-tag"
                style={{ "--item-accent": visual.accent } as CSSProperties}
              >
                <AppIcon name={visual.icon} className="hud-inline-icon" />
                {LL.items.stack({
                  label: getItemTranslation(LL, entry.type).name(),
                  count: entry.count,
                })}
              </span>
            );
          })
        ) : (
          <span className="hud-item-tag">{locale === "ja" ? "なし" : "None"}</span>
        )}
        {legendTags.map((segment) => (
          <span key={`legend-${segment}`} className="hud-item-tag">
            {segment}
          </span>
        ))}
      </div>
      {hud.pickupToast ? (
        <div
          className="hud-pickup-toast"
          style={{ "--toast-color": hud.pickupToast.color } as CSSProperties}
        >
          <AppIcon
            name={getItemVisualSpec(hud.pickupToast.type).icon}
            className="hud-inline-icon"
          />
          <span>{getItemTranslation(LL, hud.pickupToast.type).name()}</span>
        </div>
      ) : null}
    </>
  );
}
