import type { CSSProperties, ReactElement, RefObject } from "react";
import { ROGUE_CONFIG } from "../../game/config";
import type { HudViewModel } from "../../game/renderTypes";
import { formatTime } from "../../game/time";
import { type AppLocale, formatDecimal, formatInteger, getItemTranslation, getLL } from "../../i18n";
import { GameIcon } from "./GameIcon";

export interface HudPanelProps {
  locale: AppLocale;
  hud: HudViewModel;
  scoreRef: RefObject<HTMLSpanElement | null>;
}

export function HudPanel({ locale, hud, scoreRef }: HudPanelProps): ReactElement {
  const LL = getLL(locale);
  const progressPercent = `${Math.round(Math.max(0, Math.min(1, hud.progressRatio)) * 1000) / 10}%`;
  const stageModeLabel = LL.hud.stageMode[hud.stage.mode]();
  const stageCounter =
    hud.stage.mode === "endless"
      ? LL.hud.endlessStageCounter({ current: hud.stage.current })
      : LL.hud.stageCounter({ current: hud.stage.current, total: hud.stage.total });
  const stageMeta: string[] = [`${stageModeLabel} ${stageCounter}`];
  const combatMeta: string[] = [];

  if (hud.stage.route) {
    stageMeta.push(LL.hud.routeValue({ route: hud.stage.route }));
  }
  if (hud.stage.modifierKey) {
    stageMeta.push(LL.hud.modifierValue({ label: LL.stageModifiers[hud.stage.modifierKey]() }));
  }
  if (hud.stage.boss) {
    stageMeta.push(
      `${LL.hud.labels.bossHp()} ${LL.hud.bossValue({
        hp: hud.stage.boss.hp,
        maxHp: hud.stage.boss.maxHp,
        phase: LL.hud.phase({ phase: hud.stage.boss.phase }),
      })}`,
    );
    if (hud.stage.boss.intent) {
      combatMeta.push(getBossIntentLabel(LL, hud.stage.boss.intent));
    }
    if (typeof hud.stage.boss.castProgress === "number") {
      combatMeta.push(`${LL.hud.labels.cast()} ${Math.round(hud.stage.boss.castProgress * 100)}%`);
    }
    if (typeof hud.stage.boss.weakWindowProgress === "number") {
      combatMeta.push(
        `${LL.hud.labels.weakWindow()} ${Math.round(hud.stage.boss.weakWindowProgress * 100)}%`,
      );
    }
  }
  if (hud.stage.debugModeEnabled) {
    stageMeta.push(hud.stage.debugRecordResults ? LL.hud.debug.on() : LL.hud.debug.off());
  }

  const itemTags: string[] = hud.activeItems.map((entry) =>
    LL.items.stack({
      label: getItemTranslation(LL, entry.type).name(),
      count: entry.count,
    }),
  );

  if (hud.flags.hazardBoostActive) {
    itemTags.push(LL.hud.effect.hazardBoost());
  }
  if (hud.flags.pierceSlowSynergy) {
    itemTags.push(LL.hud.effect.pierceSlow());
  }
  if (hud.flags.riskMode) {
    itemTags.push(LL.hud.effect.risk());
  }
  if (hud.flags.rogueUpgradesTaken > 0) {
    itemTags.push(
      `${LL.hud.labels.upgrades()} ${LL.hud.rogueProgress({
        taken: hud.flags.rogueUpgradesTaken,
        max: Math.max(ROGUE_CONFIG.maxUpgrades, hud.flags.rogueUpgradeCap),
      })}`,
    );
  }
  itemTags.push(
    hud.flags.magicCooldownSec <= 0
      ? LL.hud.effect.magicReady()
      : LL.hud.effect.magicCooldown({
          seconds: formatDecimal(locale, hud.flags.magicCooldownSec, 1),
        }),
  );
  if (hud.flags.warpLegendVisible) {
    itemTags.push(LL.hud.labels.warpLegend());
  }
  if (hud.flags.steelLegendVisible) {
    itemTags.push(LL.hud.labels.steelLegend());
  }
  if (hud.flags.generatorLegendVisible) {
    itemTags.push(LL.hud.labels.generatorLegend());
  }
  if (hud.flags.gateLegendVisible) {
    itemTags.push(LL.hud.labels.gateLegend());
  }
  if (hud.flags.turretLegendVisible) {
    itemTags.push(LL.hud.labels.turretLegend());
  }
  if (hud.flags.overdriveActive) {
    itemTags.push(LL.hud.labels.overdrive());
  }

  return (
    <div
      id="hud"
      aria-live="polite"
      data-theme={hud.visualThemeId}
      style={
        {
          "--hud-accent": hud.accentColor,
          "--hud-danger": hud.dangerColor,
        } as CSSProperties
      }
    >
      <div id="hud-progress-track" aria-hidden="true">
        <div id="hud-progress-fill" style={{ width: progressPercent }} />
      </div>
      {hud.stageIntro ? (
        <div className={`hud-stage-intro hud-stage-intro-${hud.stageIntro.kind}`}>
          <span className="hud-stage-intro-eyebrow">
            {hud.stageIntro.kind === "stage"
              ? locale === "ja"
                ? "STAGE SHIFT"
                : "STAGE SHIFT"
              : hud.stageIntro.kind === "midboss"
                ? locale === "ja"
                  ? "中ボス接近"
                  : "MIDBOSS INBOUND"
                : hud.stageIntro.kind === "boss"
                  ? locale === "ja"
                    ? "最終ボス"
                    : "FINAL BOSS"
                  : "EX COURSE"}
          </span>
          <strong>
            {hud.stageIntro.kind === "stage"
              ? `${stageModeLabel} ${stageCounter}`
              : getIntroLabel(locale, hud.stageIntro.kind)}
          </strong>
        </div>
      ) : null}
      {hud.bossBanner ? (
        <div className={`hud-boss-banner hud-boss-banner-${hud.bossBanner.warningLevel}`}>
          <span className="hud-banner-icon">
            <GameIcon name="boss" />
          </span>
          <strong>
            {locale === "ja" ? `PHASE ${hud.bossBanner.phase}` : `PHASE ${hud.bossBanner.phase}`}
          </strong>
          <span className="hud-boss-warning">
            <GameIcon name="warning" />
            {hud.bossBanner.warningLevel === "critical"
              ? locale === "ja"
                ? "制圧警報"
                : "CRITICAL"
              : hud.bossBanner.warningLevel === "elevated"
                ? locale === "ja"
                  ? "警戒上昇"
                  : "ALERT"
                : locale === "ja"
                  ? "監視中"
                  : "WATCH"}
          </span>
        </div>
      ) : null}
      <div className="hud-primary">
        <span id="score" ref={scoreRef}>
          <GameIcon name="score" className="hud-stat-icon" />
          {LL.hud.labels.score()}: {formatInteger(locale, hud.score)}
        </span>
        <span id="lives">
          <GameIcon name="lives" className="hud-stat-icon" />
          {LL.hud.labels.lives()}: {formatInteger(locale, hud.lives)}
        </span>
        <span id="time">
          <GameIcon name="time" className="hud-stat-icon" />
          {LL.hud.labels.time()}: {formatTime(hud.elapsedSec)}
        </span>
        <span id="combo">
          <GameIcon name="combo" className="hud-stat-icon" />
          {LL.hud.labels.combo()} {LL.hud.comboValue({ value: formatDecimal(locale, hud.comboMultiplier) })}
        </span>
      </div>
      <div id="stage" className="hud-stage-meta">
        {stageMeta.map((segment, index) => (
          <span key={`stage-meta-${index.toString()}`}>{segment}</span>
        ))}
      </div>
      <div className="hud-stage-meta hud-stage-combat">
        <span>
          <GameIcon name="risk" className="hud-inline-icon" />
          {LL.hud.labels.riskChain()}: {Math.round(hud.riskChain.value)}/{Math.round(hud.riskChain.max)}
        </span>
        {combatMeta.map((segment, index) => (
          <span key={`combat-meta-${index.toString()}`}>{segment}</span>
        ))}
        {hud.missionProgress.map((mission) => (
          <span key={`mission-${mission.key}`}>
            {mission.achieved ? "✓" : "•"} {LL.stageMission[mission.key]()}
          </span>
        ))}
      </div>
      <div id="items" className="hud-item-tags">
        <span className="hud-item-title">{LL.hud.labels.items()}:</span>
        {itemTags.map((segment, index) => (
          <span key={`item-tag-${index.toString()}`} className="hud-item-tag">
            <GameIcon name={hud.activeItems[index]?.type ?? "boss"} className="hud-inline-icon" />
            {segment}
          </span>
        ))}
      </div>
      {hud.pickupToast ? (
        <div className="hud-pickup-toast" style={{ "--toast-color": hud.pickupToast.color } as CSSProperties}>
          {getItemTranslation(LL, hud.pickupToast.type).name()}
        </div>
      ) : null}
    </div>
  );
}

function getIntroLabel(locale: AppLocale, kind: NonNullable<HudViewModel["stageIntro"]>["kind"]): string {
  if (kind === "midboss") {
    return locale === "ja" ? "中ボス戦" : "Midboss Clash";
  }
  if (kind === "boss") {
    return locale === "ja" ? "最終決戦" : "Final Breaker";
  }
  if (kind === "ex") {
    return locale === "ja" ? "EX侵攻" : "EX Course";
  }
  return locale === "ja" ? "ステージ開始" : "Stage Start";
}

function getBossIntentLabel(
  LL: ReturnType<typeof getLL>,
  intent: NonNullable<HudViewModel["stage"]["boss"]>["intent"],
): string {
  if (!intent) {
    return "";
  }
  switch (intent) {
    case "burst":
      return LL.hud.bossIntent.burst();
    case "gate_sweep":
      return LL.hud.bossIntent.gate_sweep();
    default:
      return LL.hud.bossIntent[intent]();
  }
}
