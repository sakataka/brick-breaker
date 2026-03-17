import type { CSSProperties, ReactElement, RefObject } from "react";
import { getArtCssVars, resolveVisualAssetProfile } from "../../art/visualAssets";
import type { HudViewModel } from "../../game/renderTypes";
import { formatTime } from "../../game/time";
import type { VisualState } from "../../game/uiTheme";
import {
  type AppLocale,
  formatDecimal,
  formatInteger,
  getItemTranslation,
  getLL,
} from "../../i18n";
import { AppIcon } from "./AppIcon";
import { getItemVisualSpec } from "./itemVisualRegistry";
import { Banner, DangerPill, IconLabel, ProgressBar, StatChip } from "./uiPrimitives";

export interface HudPanelProps {
  locale: AppLocale;
  hud: HudViewModel;
  scoreRef: RefObject<HTMLElement | null>;
}

export function HudPanel({ locale, hud, scoreRef }: HudPanelProps): ReactElement {
  const LL = getLL(locale);
  const stageCounter = LL.hud.stageCounter({ current: hud.stage.current, total: hud.stage.total });
  const activeItems = hud.activeItems.filter((entry) => entry.count > 0);
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
      <div className="hud-primary">
        <StatChip
          id="score"
          icon={<AppIcon name="score" className="hud-stat-icon" />}
          label={LL.hud.labels.score()}
          value={formatInteger(locale, hud.score)}
          emphasis="accent"
          valueRef={scoreRef}
        />
        <StatChip
          id="lives"
          icon={<AppIcon name="lives" className="hud-stat-icon" />}
          label={LL.hud.labels.lives()}
          value={formatInteger(locale, hud.lives)}
        />
        <StatChip
          id="time"
          icon={<AppIcon name="time" className="hud-stat-icon" />}
          label={LL.hud.labels.time()}
          value={formatTime(hud.elapsedSec)}
        />
        <StatChip
          id="combo"
          icon={<AppIcon name="combo" className="hud-stat-icon" />}
          label={LL.hud.labels.combo()}
          value={LL.hud.comboValue({ value: formatDecimal(locale, hud.comboMultiplier) })}
          emphasis={hud.comboMultiplier > 1 ? "accent" : "default"}
        />
      </div>
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
          {buildLegendTags(locale, hud).map((segment) => (
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
        {buildLegendTags(locale, hud).map((segment) => (
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
    </div>
  );
}

function getThreatLabel(locale: AppLocale, threat: HudViewModel["stage"]["threatLevel"]): string {
  if (locale === "ja") {
    switch (threat) {
      case "critical":
        return "脅威: CRITICAL";
      case "high":
        return "脅威: HIGH";
      case "medium":
        return "脅威: MID";
      default:
        return "脅威: LOW";
    }
  }
  return `THREAT ${threat.toUpperCase()}`;
}

function mapThreatToWarning(
  threat: HudViewModel["stage"]["threatLevel"],
): VisualState["warningLevel"] {
  if (threat === "critical") {
    return "critical";
  }
  if (threat === "high") {
    return "elevated";
  }
  return "calm";
}

function getPreviewTagLabel(
  locale: AppLocale,
  tag: HudViewModel["stage"]["previewTags"][number],
): string {
  const ja: Record<typeof tag, string> = {
    shielded_grid: "遮蔽グリッド",
    relay_chain: "中継連鎖",
    reactor_chain: "炉心連鎖",
    turret_lane: "砲撃レーン",
    hazard_flux: "乱流域",
    gate_pressure: "ゲート圧迫",
    boss_break: "ボス破壊",
    survival_check: "生存重視",
    fortress_core: "要塞コア",
    sweep_alert: "掃射警戒",
  };
  const en: Record<typeof tag, string> = {
    shielded_grid: "Shield Grid",
    relay_chain: "Relay Chain",
    reactor_chain: "Reactor Chain",
    turret_lane: "Turret Lane",
    hazard_flux: "Flux Hazard",
    gate_pressure: "Gate Pressure",
    boss_break: "Boss Break",
    survival_check: "Survival",
    fortress_core: "Fortress Core",
    sweep_alert: "Sweep Alert",
  };
  return locale === "ja" ? ja[tag] : en[tag];
}

function getScoreFocusLabel(locale: AppLocale, focus: HudViewModel["stage"]["scoreFocus"]): string {
  const ja: Record<typeof focus, string> = {
    reactor_chain: "稼ぎ: 炉心連鎖",
    turret_cancel: "稼ぎ: 弾消し",
    boss_break: "稼ぎ: ブレイク",
    survival_chain: "稼ぎ: ノーミス",
  };
  const en: Record<typeof focus, string> = {
    reactor_chain: "FOCUS REACTOR",
    turret_cancel: "FOCUS CANCEL",
    boss_break: "FOCUS BREAK",
    survival_chain: "FOCUS SURVIVE",
  };
  return locale === "ja" ? ja[focus] : en[focus];
}

function getBannerEyebrow(locale: AppLocale, banner: VisualState["banner"]): string {
  if (!banner) {
    return "";
  }
  switch (banner.kind) {
    case "midboss":
      return locale === "ja" ? "中ボス接近" : "MIDBOSS INBOUND";
    case "boss":
      return locale === "ja" ? "最終ボス" : "FINAL BOSS";
    case "tier2":
      return locale === "ja" ? "脅威上昇" : "THREAT TIER 2";
    default:
      return "STAGE SHIFT";
  }
}

function getBannerTitle(
  locale: AppLocale,
  banner: VisualState["banner"],
  fallback: string,
): string {
  if (!banner) {
    return fallback;
  }
  switch (banner.kind) {
    case "midboss":
      return locale === "ja" ? "中ボス戦" : "Midboss Clash";
    case "boss":
      return locale === "ja" ? "最終決戦" : "Final Breaker";
    case "tier2":
      return locale === "ja" ? "Threat Tier 2" : "Threat Tier 2";
    default:
      return fallback;
  }
}

function getWarningLabel(locale: AppLocale, warningLevel: VisualState["warningLevel"]): string {
  if (warningLevel === "critical") {
    return locale === "ja" ? "制圧警報" : "CRITICAL";
  }
  if (warningLevel === "elevated") {
    return locale === "ja" ? "警戒上昇" : "ALERT";
  }
  return locale === "ja" ? "監視中" : "WATCH";
}

function buildLegendTags(locale: AppLocale, hud: HudViewModel): string[] {
  const LL = getLL(locale);
  const tags: string[] = [];
  if (hud.flags.hazardBoostActive) {
    tags.push(LL.hud.effect.hazardBoost());
  }
  if (hud.flags.pierceSlowSynergy) {
    tags.push(LL.hud.effect.pierceSlow());
  }
  tags.push(
    hud.flags.magicCooldownSec <= 0
      ? LL.hud.effect.magicReady()
      : LL.hud.effect.magicCooldown({
          seconds: formatDecimal(locale, hud.flags.magicCooldownSec, 1),
        }),
  );
  if (hud.flags.warpLegendVisible) {
    tags.push(LL.hud.labels.warpLegend());
  }
  if (hud.flags.steelLegendVisible) {
    tags.push(LL.hud.labels.steelLegend());
  }
  if (hud.flags.generatorLegendVisible) {
    tags.push(LL.hud.labels.generatorLegend());
  }
  if (hud.flags.gateLegendVisible) {
    tags.push(LL.hud.labels.gateLegend());
  }
  if (hud.flags.turretLegendVisible) {
    tags.push(LL.hud.labels.turretLegend());
  }
  return tags;
}

function getBossIntentLabel(
  LL: ReturnType<typeof getLL>,
  intent: NonNullable<HudViewModel["stage"]["boss"]>["intent"],
): string {
  if (!intent) {
    return LL.hud.labels.cast();
  }
  if (intent === "burst") {
    return LL.hud.bossIntent.burst();
  }
  if (intent === "gate_sweep") {
    return LL.hud.bossIntent.gate_sweep();
  }
  return LL.hud.bossIntent[intent]();
}
