import type { ReactElement, RefObject } from "react";
import type { HudViewModel } from "../../../game-v2/public/renderTypes";
import { formatDecimal, formatInteger, getLL, type AppLocale } from "../../../i18n";
import { formatTime } from "../../../game-v2/public/time";
import { AppIcon } from "../AppIcon";
import { StatChip } from "../uiPrimitives";

export interface HudPrimaryStatsProps {
  locale: AppLocale;
  hud: HudViewModel;
  scoreRef: RefObject<HTMLElement | null>;
}

export function HudPrimaryStats({ locale, hud, scoreRef }: HudPrimaryStatsProps): ReactElement {
  const LL = getLL(locale);
  return (
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
  );
}
