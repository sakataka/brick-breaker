import { applyAssistToPaddle } from "../assistSystem";
import { getPaddleScale } from "../itemSystem";
import type { GameState } from "../types";
import type { GamePipelineDeps, TickContext } from "./gamePipelineTypes";

export function resolveInputPhase(
  state: GameState,
  deps: GamePipelineDeps,
  ctx: TickContext,
): void {
  const basePaddleWidth = ctx.balance.paddleWidth * getPaddleScale(state.combat.items);
  applyAssistToPaddle(
    state.combat.paddle,
    basePaddleWidth,
    deps.config.width,
    state.combat.assist,
    state.run.elapsedSec,
  );
}
