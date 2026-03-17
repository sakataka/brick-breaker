import type { ReactElement } from "react";
import type { HudViewModel } from "../../../game/renderTypes";
import { formatInteger, type AppLocale } from "../../../i18n";
import { getScoreFocusLabel } from "./hudText";

export interface HudScoreChaseProps {
  locale: AppLocale;
  hud: HudViewModel;
}

export function HudScoreChase({ locale, hud }: HudScoreChaseProps): ReactElement {
  return (
    <>
      <div className="hud-score-focus-row">
        <span className="hud-score-focus-pill">
          {getScoreFocusLabel(locale, hud.stage.scoreFocus)}
        </span>
        {hud.record.currentRunRecord ? (
          <span className="hud-record-pill">
            {locale === "ja" ? "NEW RECORD" : "NEW RECORD"} +
            {formatInteger(locale, hud.record.deltaToBest)}
          </span>
        ) : (
          <span className="hud-record-pill hud-record-pill-muted">
            {locale === "ja" ? "BEST" : "BEST"} {formatInteger(locale, hud.record.courseBestScore)}
          </span>
        )}
      </div>
      <div className="hud-score-feed">
        {hud.scoreFeed.slice(0, 3).map((entry) => (
          <span
            key={`${entry.label}-${entry.amount}-${entry.progress}`}
            className={`hud-score-feed-entry hud-score-feed-${entry.tone}`}
            style={{ opacity: Math.max(0.24, entry.progress) }}
          >
            <strong>{entry.label}</strong>
            <small>+{formatInteger(locale, entry.amount)}</small>
          </span>
        ))}
        {hud.styleBonus.lastBonusLabel ? (
          <span className="hud-score-feed-entry hud-score-feed-style">
            <strong>{hud.styleBonus.lastBonusLabel}</strong>
            <small>
              {locale === "ja" ? "CHAIN" : "CHAIN"} {hud.styleBonus.chainLevel}
            </small>
          </span>
        ) : null}
      </div>
    </>
  );
}
