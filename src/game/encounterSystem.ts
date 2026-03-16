import type { StageContext } from "./stageContext";
import type { EncounterCueKind, EncounterTimelineEvent, GameState, ThreatLevel } from "./types";

const THREAT_ORDER: ThreatLevel[] = ["low", "medium", "high", "critical"];

export function updateEncounterRuntime(
  state: GameState,
  stageContext: StageContext,
  deltaSec: number,
): void {
  const encounter = state.encounter.runtime;
  encounter.activeMechanics = (stageContext.stage.boardMechanics ?? []).map((entry) => entry.role);
  encounter.activeCues = encounter.activeCues
    .map((cue) => ({ ...cue, remainingSec: Math.max(0, cue.remainingSec - deltaSec) }))
    .filter((cue) => cue.remainingSec > 0);

  const timeline = stageContext.stage.encounterTimeline ?? [];
  for (const [index, event] of timeline.entries()) {
    const eventKey = `${stageContext.stage.id}:${index}:${event.trigger}`;
    if (encounter.triggeredTimelineEvents.includes(eventKey)) {
      continue;
    }
    if (!isTimelineTriggerReady(state, stageContext, event)) {
      continue;
    }
    pushEncounterCue(state, event.cue, event.threatLevel, event.durationSec);
    encounter.triggeredTimelineEvents.push(eventKey);
  }

  const telegraphThreat = state.encounter.runtime.telegraph?.severity ?? "low";
  const baseThreat = stageContext.stage.hazardScript?.intensity ?? "low";
  let nextThreat = maxThreat(baseThreat, telegraphThreat);
  for (const cue of encounter.activeCues) {
    nextThreat = maxThreat(nextThreat, cue.severity);
  }
  if (state.encounter.bossPhase >= 3) {
    nextThreat = maxThreat(nextThreat, "critical");
  } else if (state.encounter.bossPhase >= 2) {
    nextThreat = maxThreat(nextThreat, "high");
  }
  encounter.stageThreatLevel = nextThreat;
  state.encounter.threatLevel = nextThreat;
  state.encounter.activeTelegraphs = state.encounter.runtime.telegraph
    ? [state.encounter.runtime.telegraph]
    : [];
}

export function pushEncounterCue(
  state: Pick<GameState, "encounter" | "ui">,
  kind: EncounterCueKind,
  severity: ThreatLevel,
  durationSec: number,
): void {
  const encounter = state.encounter.runtime;
  const existing = encounter.activeCues.find((cue) => cue.kind === kind);
  if (existing) {
    existing.remainingSec = Math.max(existing.remainingSec, durationSec);
    existing.maxSec = Math.max(existing.maxSec, durationSec);
    existing.severity = maxThreat(existing.severity, severity);
  } else {
    encounter.activeCues.push({
      kind,
      remainingSec: durationSec,
      maxSec: durationSec,
      severity,
    });
  }

  state.ui.vfx.floatingTexts.push({
    key: severity === "critical" ? "boss_warning" : "reinforce",
    pos: { x: 480, y: 114 },
    lifeMs: 260,
    maxLifeMs: 260,
    color:
      severity === "critical"
        ? "rgba(255, 112, 140, 0.96)"
        : severity === "high"
          ? "rgba(255, 190, 122, 0.95)"
          : "rgba(146, 232, 255, 0.92)",
  });
}

function maxThreat(left: ThreatLevel, right: ThreatLevel): ThreatLevel {
  return THREAT_ORDER[Math.max(THREAT_ORDER.indexOf(left), THREAT_ORDER.indexOf(right))] ?? left;
}

function isTimelineTriggerReady(
  state: GameState,
  stageContext: StageContext,
  event: EncounterTimelineEvent,
): boolean {
  const sinceStart = state.run.elapsedSec - state.encounter.stats.startedAtSec;
  switch (event.trigger) {
    case "stage_start":
      return sinceStart <= 0.2;
    case "elapsed_10":
      return sinceStart >= 10;
    case "elapsed_20":
      return sinceStart >= 20;
    case "boss_phase_2":
      return state.encounter.bossPhase >= 2;
    case "boss_phase_3":
      return state.encounter.bossPhase >= 3;
    case "generator_down":
      return (
        stageContext.stage.tags?.includes("generator") === true &&
        state.encounter.stats.generatorShutdown === true
      );
    case "turret_destroyed":
      return (
        stageContext.stage.tags?.includes("turret") === true &&
        !state.combat.bricks.some((brick) => brick.alive && brick.kind === "turret")
      );
    case "board_clear":
      return !state.combat.bricks.some((brick) => brick.alive);
    default:
      return false;
  }
}
