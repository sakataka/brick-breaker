import { syncRecordStateFromMeta } from "../scoreSystem";
import { readMetaProgress, writeMetaProgress } from "../metaProgress";
import { resetRoundState } from "../roundSystem";
import { resolveStageMetadataFromState } from "../stageContext";
import { spawnItemPickupFeedback } from "../vfxSystem";
import type { GameTestScenario } from "../testBridge";
import type { GameState, RandomSource, Scene } from "../types";
import type { SessionPorts } from "./SessionPorts";
import type { SceneMachine } from "../sceneMachine";
import type { CoreEngine } from "../../core/engine";
import type { GameConfig } from "../types";

export interface RuntimeTestSupportContext {
  state: GameState;
  sceneMachine: SceneMachine;
  windowRef: Window;
  ports: SessionPorts;
  engine: CoreEngine;
  config: GameConfig;
  random: RandomSource;
  publishState: () => void;
}

export function forceSceneForTest(scene: Scene, context: RuntimeTestSupportContext): void {
  const previous = context.state.scene;
  context.sceneMachine.force(scene);
  context.state.scene = scene;
  context.ports.syncAudioScene(previous, context.state.scene, context.state);
  context.publishState();
}

export function setGameOverScoreForTest(
  score: number,
  lives: number,
  context: RuntimeTestSupportContext,
): void {
  const previous = context.state.scene;
  context.sceneMachine.force("gameover");
  context.state.run.lastGameOverScore = Math.max(0, Math.round(score));
  context.state.run.score = 0;
  context.state.run.lives = Math.max(0, Math.round(lives));
  context.state.scene = "gameover";
  context.ports.syncAudioScene(previous, context.state.scene, context.state);
  context.publishState();
}

export function unlockThreatTier2ForTest(context: RuntimeTestSupportContext): void {
  const currentMeta = readMetaProgress(context.windowRef.localStorage);
  const nextMeta = {
    ...currentMeta,
    progression: {
      ...currentMeta.progression,
      threatTier2Unlocked: true,
    },
  };
  writeMetaProgress(context.windowRef.localStorage, nextMeta);
  context.ports.setMetaProgress(nextMeta);
  syncRecordStateFromMeta(context.state, nextMeta);
  context.publishState();
}

export function loadScenarioForTest(
  scenario: GameTestScenario,
  context: RuntimeTestSupportContext,
): void {
  const previousScene = context.state.scene;
  context.state.run.options.threatTier = 1;
  switch (scenario) {
    case "stage11_legends":
      loadEncounterForTest(10, context);
      break;
    case "boss_telegraph":
      loadEncounterForTest(11, context);
      context.state.encounter.bossPhase = 3;
      context.state.encounter.runtime.kind = "boss";
      context.state.encounter.runtime.profile = "final_core";
      context.state.encounter.runtime.phase = 3;
      context.state.encounter.runtime.stageThreatLevel = "critical";
      context.state.encounter.threatLevel = "critical";
      context.state.encounter.runtime.telegraph = {
        kind: "volley",
        remainingSec: 1,
        maxSec: 1,
        targetX: context.state.combat.paddle.x + context.state.combat.paddle.width / 2,
        spread: 92,
        severity: "critical",
      };
      context.state.encounter.activeTelegraphs = [context.state.encounter.runtime.telegraph];
      break;
    case "pickup_toast":
      loadEncounterForTest(0, context);
      spawnItemPickupFeedback(
        context.state.ui.vfx,
        "shockwave",
        context.state.combat.paddle.x + context.state.combat.paddle.width / 2,
        context.state.combat.paddle.y - 8,
      );
      break;
  }
  context.engine.resetClock();
  context.ports.audio.notifyStageChanged(resolveStageMetadataFromState(context.state).musicCue);
  if (previousScene !== context.state.scene) {
    context.ports.syncAudioScene(previousScene, context.state.scene, context.state);
  }
  context.publishState();
}

function loadEncounterForTest(startStageIndex: number, context: RuntimeTestSupportContext): void {
  context.sceneMachine.force("playing");
  context.state.scene = "playing";
  resetRoundState(
    context.state,
    context.config,
    context.state.ui.vfx.reducedMotion,
    context.random,
    { startStageIndex },
  );
  context.state.encounter.story.activeStageNumber = null;
}
