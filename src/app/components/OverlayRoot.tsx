import type { ReactElement } from "react";
import { getDailyChallenge } from "../../game/dailyChallenge";
import type { OverlayViewModel } from "../../game/renderTypes";
import type { RogueUpgradeType } from "../../game/types";
import { type AppLocale, getLL } from "../../i18n";
import type { StartSettingsSelection } from "../store";
import {
  buildCampaignResultRows,
  buildOverlaySubText,
  buildStageLabel,
  formatRogueUpgradeLabel,
  getOverlayButton,
  getOverlayMessage,
} from "../viewmodels/overlayText";
import { StageResultPanel } from "./StageResultPanel";
import { StartSettingsForm } from "./StartSettingsForm";

export interface OverlayRootProps {
  locale: AppLocale;
  overlay: OverlayViewModel;
  startSettings: StartSettingsSelection;
  rogueSelection: RogueUpgradeType;
  onStartSettingsChange: (patch: Partial<StartSettingsSelection>) => void;
  onLocaleChange: (locale: AppLocale) => void;
  onRogueSelectionChange: (value: RogueUpgradeType) => void;
  onPrimaryAction: () => void;
}

export function OverlayRoot({
  locale,
  overlay,
  startSettings,
  rogueSelection,
  onStartSettingsChange,
  onLocaleChange,
  onRogueSelectionChange,
  onPrimaryAction,
}: OverlayRootProps): ReactElement {
  const LL = getLL(locale);
  const dailyChallenge = getDailyChallenge();
  const overlayMessage = getOverlayMessage(LL, overlay.scene);
  const overlaySubText = buildOverlaySubText(locale, LL, overlay);
  const campaignRows = buildCampaignResultRows(LL, overlay.campaignResults ?? []);
  const showOverlay = overlay.scene !== "playing";
  const isStartScene = overlay.scene === "start";
  const showResults = overlay.scene === "clear";
  const showRogue = overlay.scene === "stageclear" && Boolean(overlay.rogueOffer);
  const debugBadge = overlay.stage.debugModeEnabled
    ? overlay.stage.debugRecordResults
      ? LL.hud.debug.badgeOn()
      : LL.hud.debug.badgeOff()
    : "";

  return (
    <div id="overlay" data-scene={overlay.scene} className={showOverlay ? "overlay" : "overlay hidden"}>
      <div className={isStartScene ? "card overlay-card-layout" : "card"}>
        <div className={isStartScene ? "overlay-card-header" : undefined}>
          <h1>{LL.app.title()}</h1>
          <p id="overlay-message">{overlayMessage}</p>
          <p id="overlay-sub" className="subtle">
            {overlaySubText}
          </p>
          {debugBadge ? <p className="subtle">{debugBadge}</p> : null}
        </div>

        {isStartScene ? (
          <div className="overlay-settings-scroll">
            <StartSettingsForm
              locale={locale}
              settings={startSettings}
              onChange={onStartSettingsChange}
              onLocaleChange={onLocaleChange}
            />
            <p id="daily-challenge-label" className="subtle">
              {LL.overlay.dailySummary({
                label: LL.overlay.dailyLabel(),
                key: dailyChallenge.key,
                objective: LL.daily.objectives[dailyChallenge.objectiveKey](),
              })}
            </p>
          </div>
        ) : (
          <>
            <div id="start-settings" className="start-settings panel-hidden" />
            <p id="daily-challenge-label" className="subtle panel-hidden" />

            <StageResultPanel
              title={LL.overlay.stageResultsTitle()}
              rows={campaignRows}
              sectionId="overlay-results-section"
              listId="overlay-results"
              hidden={!showResults}
            />

            <StageResultPanel
              title={LL.overlay.rogueTitle()}
              rows={[]}
              sectionId="overlay-rogue-section"
              hidden={!showRogue}
            >
              <select
                id="overlay-rogue-select"
                value={rogueSelection}
                onChange={(event) => {
                  onRogueSelectionChange(event.target.value as RogueUpgradeType);
                }}
              >
                {(overlay.rogueOffer?.options ?? ["score_core", "speed_core"]).map((option) => (
                  <option key={option} value={option}>
                    {formatRogueUpgradeLabel(LL, option)}{" "}
                    {LL.overlay.rogueRemaining({ count: overlay.rogueOffer?.remaining ?? 0 })}
                  </option>
                ))}
              </select>
            </StageResultPanel>

            {overlay.scene !== "story" && overlay.scene !== "error" ? (
              <p className="subtle overlay-stage-label">{buildStageLabel(LL, overlay)}</p>
            ) : null}
          </>
        )}

        <div className={isStartScene ? "overlay-fixed-footer" : undefined}>
          <button id="overlay-button" type="button" onClick={onPrimaryAction}>
            {getOverlayButton(LL, overlay.scene)}
          </button>
          <p className="subtle">{LL.app.pauseHint()}</p>
        </div>
      </div>
    </div>
  );
}
