import type { CSSProperties, ReactElement, RefObject } from "react";
import { ROGUE_CONFIG } from "../../game/config";
import type { HudViewModel } from "../../game/renderTypes";
import { formatTime } from "../../game/time";
import { type AppLocale, formatDecimal, formatInteger, getItemTranslation, getLL } from "../../i18n";

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
      stageMeta.push(LL.hud.bossIntent[hud.stage.boss.intent]());
    }
  }
  if (hud.stage.debugModeEnabled) {
    stageMeta.push(hud.stage.debugRecordResults ? LL.hud.debug.on() : LL.hud.debug.off());
  }

  const itemTags: string[] = hud.activeItems.map((entry) =>
    LL.items.stack({
      label: getItemTranslation(LL, entry.type).hud(),
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

  return (
    <div id="hud" aria-live="polite" style={{ "--hud-accent": hud.accentColor } as CSSProperties}>
      <div id="hud-progress-track" aria-hidden="true">
        <div id="hud-progress-fill" style={{ width: progressPercent }} />
      </div>
      <div className="hud-primary">
        <span id="score" ref={scoreRef}>
          {LL.hud.labels.score()}: {formatInteger(locale, hud.score)}
        </span>
        <span id="lives">
          {LL.hud.labels.lives()}: {formatInteger(locale, hud.lives)}
        </span>
        <span id="time">
          {LL.hud.labels.time()}: {formatTime(hud.elapsedSec)}
        </span>
        <span id="combo">
          {LL.hud.labels.combo()} {LL.hud.comboValue({ value: formatDecimal(locale, hud.comboMultiplier) })}
        </span>
      </div>
      <div id="stage" className="hud-stage-meta">
        {stageMeta.map((segment, index) => (
          <span key={`stage-meta-${index.toString()}`}>{segment}</span>
        ))}
      </div>
      <div id="items" className="hud-item-tags">
        <span className="hud-item-title">{LL.hud.labels.items()}:</span>
        {itemTags.map((segment, index) => (
          <span key={`item-tag-${index.toString()}`} className="hud-item-tag">
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
