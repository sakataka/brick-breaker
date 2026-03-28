import type { HudViewModel } from "../../../game-v2/public/renderTypes";
import { formatDecimal, getLL, type AppLocale } from "../../../i18n";
import type { VisualState } from "../../../game-v2/public/uiTheme";

export function getThreatLabel(
  locale: AppLocale,
  threat: HudViewModel["stage"]["threatLevel"],
): string {
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

export function mapThreatToWarning(
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

export function getPreviewTagLabel(
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

export function getScoreFocusLabel(
  locale: AppLocale,
  focus: HudViewModel["stage"]["scoreFocus"],
): string {
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

export function getBannerEyebrow(locale: AppLocale, banner: VisualState["banner"]): string {
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

export function getBannerTitle(
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
      return "Threat Tier 2";
    default:
      return fallback;
  }
}

export function getWarningLabel(
  locale: AppLocale,
  warningLevel: VisualState["warningLevel"],
): string {
  if (warningLevel === "critical") {
    return locale === "ja" ? "制圧警報" : "CRITICAL";
  }
  if (warningLevel === "elevated") {
    return locale === "ja" ? "警戒上昇" : "ALERT";
  }
  return locale === "ja" ? "監視中" : "WATCH";
}

export function buildLegendTags(locale: AppLocale, hud: HudViewModel): string[] {
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

export function getBossIntentLabel(
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
