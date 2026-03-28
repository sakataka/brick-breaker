import type { CSSProperties, ReactElement, RefObject } from "react";
import { getArtCssVars, resolveVisualAssetProfile } from "../../art/visualAssets";
import type { HudViewModel } from "../../game-v2/public/renderTypes";
import { type AppLocale, getLL } from "../../i18n";
import { AppIcon } from "./AppIcon";
import { Banner, DangerPill, ProgressBar } from "./uiPrimitives";
import { HudPrimaryStats } from "./hud/HudPrimaryStats";
import { HudScoreChase } from "./hud/HudScoreChase";
import { HudStageStatus } from "./hud/HudStageStatus";
import {
  getBannerEyebrow,
  getBannerTitle,
  getBossIntentLabel,
  getWarningLabel,
} from "./hud/hudText";

export interface HudPanelProps {
  locale: AppLocale;
  hud: HudViewModel;
  scoreRef: RefObject<HTMLElement | null>;
}

export function HudPanel({ locale, hud, scoreRef }: HudPanelProps): ReactElement {
  const LL = getLL(locale);
  const stageCounter = LL.hud.stageCounter({ current: hud.stage.current, total: hud.stage.total });
  const tokens = hud.visual.tokens;
  const artProfile = resolveVisualAssetProfile(
    hud.visual.assetProfileId,
    hud.visual.warningLevel,
    hud.visual.encounterEmphasis,
  );
  const cssVars = {
    "--hud-accent": tokens.accent,
    "--hud-danger": tokens.danger,
    "--hud-surface": tokens.surface,
    "--hud-surface-raised": tokens.surfaceRaised,
    "--hud-border": tokens.border,
    "--hud-glow": tokens.glow,
    "--hud-progress-track": tokens.progressTrack,
    "--hud-text": tokens.text,
    "--hud-muted": tokens.muted,
    ...getArtCssVars(artProfile),
  } as CSSProperties;

  return (
    <div id="hud" aria-live="polite" data-theme={hud.visual.themeId} style={cssVars}>
      <ProgressBar id="hud-progress-track" value={hud.progressRatio} />
      <Banner
        visible={Boolean(hud.visual.banner)}
        className="hud-stage-intro"
        eyebrow={getBannerEyebrow(locale, hud.visual.banner)}
        title={getBannerTitle(locale, hud.visual.banner, stageCounter)}
        icon={<AppIcon name="warning" weight="fill" />}
        chrome="warning"
        motionProfile={hud.visual.motionProfile}
        warningLevel={hud.visual.warningLevel}
      >
        <span>{hud.visual.chapterLabel}</span>
      </Banner>
      <Banner
        visible={Boolean(hud.stage.boss && hud.visual.bossPhase)}
        className="hud-boss-banner"
        eyebrow={hud.stage.boss ? getBossIntentLabel(LL, hud.stage.boss.intent) : ""}
        title={hud.visual.bossPhase ? `PHASE ${hud.visual.bossPhase.phase}` : ""}
        icon={<AppIcon name="boss" weight="fill" />}
        chrome="boss"
        motionProfile={hud.visual.motionProfile}
        warningLevel={hud.visual.warningLevel}
      >
        <DangerPill
          icon={<AppIcon name="warning" weight="fill" />}
          warningLevel={hud.visual.warningLevel}
        >
          {getWarningLabel(locale, hud.visual.warningLevel)}
        </DangerPill>
      </Banner>
      <HudPrimaryStats locale={locale} hud={hud} scoreRef={scoreRef} />
      <HudScoreChase locale={locale} hud={hud} />
      <HudStageStatus locale={locale} hud={hud} stageCounter={stageCounter} />
    </div>
  );
}
