import type { CSSProperties, ReactElement } from "react";
import type { HudViewModel } from "../../game/renderTypes";

export interface HudPanelProps {
  hud: HudViewModel;
  scoreRef: React.RefObject<HTMLSpanElement | null>;
}

export function HudPanel({ hud, scoreRef }: HudPanelProps): ReactElement {
  const progressPercent = `${Math.round(Math.max(0, Math.min(1, hud.progressRatio)) * 1000) / 10}%`;
  return (
    <div id="hud" aria-live="polite" style={{ "--hud-accent": hud.accentColor } as CSSProperties}>
      <div id="hud-progress-track" aria-hidden="true">
        <div id="hud-progress-fill" style={{ width: progressPercent }} />
      </div>
      <span id="score" ref={scoreRef}>
        {hud.scoreText}
      </span>
      <span id="lives">{hud.livesText}</span>
      <span id="time">{hud.timeText}</span>
      <span id="stage">{hud.stageText}</span>
      <span id="combo">{hud.comboText}</span>
      <span id="items">{hud.itemsText}</span>
    </div>
  );
}
