import type { CSSProperties, ReactElement } from "react";
import { getArtCssVars, resolveVisualAssetProfile } from "../../art/visualAssets";
import type { OverlayViewModel } from "../../game/renderTypes";
import type { StartSettingsSelection } from "../../game/startSettingsSchema";
import type { RogueUpgradeType } from "../../game/types";
import { type AppLocale, getLL } from "../../i18n";
import {
  buildCampaignResultRows,
  buildOverlaySubText,
  buildStageLabel,
  formatRogueUpgradeLabel,
  getOverlayButton,
  getOverlayMessage,
} from "../viewmodels/overlayText";
import { AppIcon } from "./AppIcon";
import { StageResultPanel } from "./StageResultPanel";
import { StartSettingsForm } from "./StartSettingsForm";
import { Banner, SectionHeader, Surface } from "./uiPrimitives";

export interface OverlayRootProps {
  locale: AppLocale;
  overlay: OverlayViewModel;
  startSettings: StartSettingsSelection;
  exUnlocked: boolean;
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
  exUnlocked,
  rogueSelection,
  onStartSettingsChange,
  onLocaleChange,
  onRogueSelectionChange,
  onPrimaryAction,
}: OverlayRootProps): ReactElement {
  const LL = getLL(locale);
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
  const tokens = overlay.visual.tokens;
  const artProfile = resolveVisualAssetProfile(
    overlay.visual.assetProfileId,
    overlay.visual.warningLevel,
    overlay.visual.encounterEmphasis,
  );
  const cssVars = {
    "--overlay-accent": tokens.accent,
    "--overlay-danger": tokens.danger,
    "--overlay-surface": tokens.surface,
    "--overlay-surface-raised": tokens.surfaceRaised,
    "--overlay-border": tokens.border,
    "--overlay-glow": tokens.glow,
    "--overlay-text": tokens.text,
    "--overlay-muted": tokens.muted,
    ...getArtCssVars(artProfile),
  } as CSSProperties;

  return (
    <div
      id="overlay"
      data-scene={overlay.scene}
      data-theme={overlay.visual.themeId}
      className={showOverlay ? "overlay" : "overlay hidden"}
      style={cssVars}
    >
      <Surface
        as="div"
        className={isStartScene ? "card overlay-card-layout" : "card"}
        emphasis="accent"
        chrome={
          overlay.scene === "error" ? "warning" : overlay.stage.current >= 12 ? "boss" : "panel"
        }
        elevated
      >
        <Banner
          visible={Boolean(overlay.visual.banner)}
          eyebrow={overlay.visual.chapterLabel.toUpperCase()}
          title={buildStageLabel(LL, overlay)}
          icon={<AppIcon name="warning" weight="fill" />}
          chrome={overlay.visual.warningLevel === "critical" ? "warning" : "panel"}
          motionProfile={overlay.visual.motionProfile}
          warningLevel={overlay.visual.warningLevel}
        >
          <span>{overlayMessage}</span>
        </Banner>
        <div className={isStartScene ? "overlay-card-header" : undefined}>
          <SectionHeader
            eyebrow={overlay.visual.chapterLabel.toUpperCase()}
            title={LL.app.title()}
            subtitle={overlayMessage}
            icon={<AppIcon name={overlay.scene === "error" ? "warning" : "boss"} weight="fill" />}
          />
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
              exUnlocked={exUnlocked}
              onChange={onStartSettingsChange}
              onLocaleChange={onLocaleChange}
            />
          </div>
        ) : (
          <>
            <div id="start-settings" className="start-settings panel-hidden" />

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
      </Surface>
    </div>
  );
}
