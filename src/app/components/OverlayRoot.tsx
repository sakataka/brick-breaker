import type { ReactElement } from "react";
import { getDailyChallenge } from "../../game/dailyChallenge";
import type { OverlayViewModel } from "../../game/renderTypes";
import type { RogueUpgradeType } from "../../game/types";
import type { StartSettingsSelection } from "../store";
import { OVERLAY_COPY } from "../viewmodels/overlayCopy";
import {
  buildCampaignResultRows,
  buildOverlaySubText,
  formatRogueUpgradeLabel,
} from "../viewmodels/overlayText";
import { StageResultPanel } from "./StageResultPanel";
import { StartSettingsForm } from "./StartSettingsForm";

export interface OverlayRootProps {
  overlay: OverlayViewModel;
  startSettings: StartSettingsSelection;
  rogueSelection: RogueUpgradeType;
  onStartSettingsChange: (patch: Partial<StartSettingsSelection>) => void;
  onRogueSelectionChange: (value: RogueUpgradeType) => void;
  onPrimaryAction: () => void;
}

export function OverlayRoot({
  overlay,
  startSettings,
  rogueSelection,
  onStartSettingsChange,
  onRogueSelectionChange,
  onPrimaryAction,
}: OverlayRootProps): ReactElement {
  const copy = OVERLAY_COPY[overlay.scene];
  const dailyChallenge = getDailyChallenge();
  const overlaySubText = buildOverlaySubText(copy.sub, overlay);
  const campaignRows = buildCampaignResultRows(overlay.campaignResults ?? []);
  const showOverlay = overlay.scene !== "playing";
  const showResults = overlay.scene === "clear";
  const showRogue = overlay.scene === "stageclear" && Boolean(overlay.rogueOffer);

  return (
    <div id="overlay" data-scene={overlay.scene} className={showOverlay ? "overlay" : "overlay hidden"}>
      <div className="card">
        <h1>Brick Breaker</h1>
        <p id="overlay-message">{copy.message}</p>
        <p id="overlay-sub" className="subtle">
          {overlaySubText}
        </p>
        {overlay.debugBadge ? <p className="subtle">{overlay.debugBadge}</p> : null}

        {overlay.scene === "start" ? (
          <StartSettingsForm settings={startSettings} onChange={onStartSettingsChange} />
        ) : (
          <div id="start-settings" className="start-settings panel-hidden" />
        )}

        {overlay.scene === "start" ? (
          <p id="daily-challenge-label" className="subtle">
            今日のデイリー({dailyChallenge.key}): {dailyChallenge.objective}
          </p>
        ) : (
          <p id="daily-challenge-label" className="subtle panel-hidden" />
        )}

        <StageResultPanel
          title="ステージ別結果"
          rows={campaignRows}
          sectionId="overlay-results-section"
          listId="overlay-results"
          hidden={!showResults}
        />

        <StageResultPanel
          title="ラン強化（3回まで）"
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
                {formatRogueUpgradeLabel(option)}（残り{overlay.rogueOffer?.remaining ?? 0}回）
              </option>
            ))}
          </select>
        </StageResultPanel>

        <button id="overlay-button" type="button" onClick={onPrimaryAction}>
          {copy.button}
        </button>
        <p className="subtle">Pキーで一時停止</p>
      </div>
    </div>
  );
}
