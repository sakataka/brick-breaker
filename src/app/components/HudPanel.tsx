import type { CSSProperties, ReactElement } from "react";
import type { HudViewModel } from "../../game/renderTypes";

export interface HudPanelProps {
  hud: HudViewModel;
  scoreRef: React.RefObject<HTMLSpanElement | null>;
}

export function HudPanel({ hud, scoreRef }: HudPanelProps): ReactElement {
  return (
    <div id="hud" aria-live="polite" style={{ "--hud-accent": hud.accentColor } as CSSProperties}>
      <span id="score" ref={scoreRef}>
        {hud.scoreText}
      </span>
      <span id="lives">{hud.livesText}</span>
      <span id="time">{hud.timeText}</span>
      <span id="stage">{hud.stageText}</span>
      <span id="combo">{hud.comboText}</span>
      <span id="focus">{hud.focusText}</span>
      <span id="a11y-badge">{hud.accessibilityText}</span>
      <span id="items">{hud.itemsText}</span>
    </div>
  );
}
