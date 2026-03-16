import type { RenderViewState } from "../../../game/renderTypes";
import { drawArenaFrame } from "./renderers/arenaFrameRenderer";
import { drawBossTelegraph, drawEnemies } from "./renderers/bossRenderer";
import { drawBricks } from "./renderers/bricksRenderer";
import { drawEncounterCueOverlay } from "./renderers/cueOverlayRenderer";
import { drawBossProjectiles, drawLaserProjectiles } from "./renderers/enemyShotRenderer";
import { drawDangerLanes, drawFluxField } from "./renderers/hazardRenderer";
import { drawFallingItems } from "./renderers/itemRenderer";
import { drawBalls, drawPaddle, drawShield, drawTrail } from "./renderers/paddleBallRenderer";
import type { DrawWorldOptions, WorldGraphics } from "./renderers/types";

export type { DrawWorldOptions } from "./renderers/types";

export function drawWorldLayer(
  graphics: WorldGraphics,
  view: RenderViewState,
  options: DrawWorldOptions,
): Set<number> {
  drawBricks(graphics, view, options);
  drawArenaFrame(graphics, view, options.offsetX, options.offsetY, options.width, options.height);
  drawPaddle(
    graphics,
    view,
    options.offsetX,
    options.offsetY,
    options.lineWidth,
    options.heavyLineWidth,
  );
  drawFluxField(graphics, view, options.offsetX, options.offsetY);
  drawShield(
    graphics,
    view.shieldCharges,
    options.width,
    options.height,
    options.offsetX,
    options.offsetY,
  );
  drawBossTelegraph(
    graphics,
    view,
    options.width,
    options.height,
    options.offsetX,
    options.offsetY,
  );
  drawDangerLanes(graphics, view, options.width, options.height, options.offsetX, options.offsetY);
  drawTrail(graphics, view, options.offsetX, options.offsetY, options.theme.trail);
  drawBalls(
    graphics,
    view,
    options.offsetX,
    options.offsetY,
    options.lineWidth,
    options.theme.ballCore,
    options.theme.ballStroke,
  );
  drawLaserProjectiles(graphics, view, options.offsetX, options.offsetY);
  drawBossProjectiles(graphics, view, options.offsetX, options.offsetY);
  drawEnemies(graphics, view, options.offsetX, options.offsetY);
  drawEncounterCueOverlay(
    graphics,
    view,
    options.offsetX,
    options.offsetY,
    options.width,
    options.height,
  );
  return drawFallingItems(graphics, view, options.offsetX, options.offsetY, options.lineWidth);
}
