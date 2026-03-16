import type { BossDefinition, EncounterProfile } from "../types";

const BOSS_DEFINITIONS: Record<EncounterProfile, BossDefinition | null> = {
  none: null,
  warden: {
    profile: "warden",
    label: "Aegis Warden",
    telegraphSet: ["gate_sweep", "volley", "sweep"],
    phaseRules: [
      { phase: 1, hpRatioThreshold: 1, threatLevel: "medium", punishWindowSec: 1.8 },
      { phase: 2, hpRatioThreshold: 0.66, threatLevel: "high", punishWindowSec: 1.5 },
      { phase: 3, hpRatioThreshold: 0.33, threatLevel: "critical", punishWindowSec: 1.2 },
    ],
    attackPatterns: [
      { phase: 1, attacks: ["gate_sweep"] },
      { phase: 2, attacks: ["gate_sweep", "volley"] },
      { phase: 3, attacks: ["sweep", "gate_sweep", "volley"] },
    ],
    breakpoints: [0.66, 0.33],
    punishWindows: [1.8, 1.5, 1.2],
    arenaEffects: ["warning_lane", "shield_online", "punish_window"],
    projectileSkin: "spike_orb",
    cancelReward: 120,
    phaseScoreRules: [
      { phase: 1, bonusPerWeakHit: 30 },
      { phase: 2, bonusPerWeakHit: 45 },
      { phase: 3, bonusPerWeakHit: 60 },
    ],
  },
  artillery: {
    profile: "artillery",
    label: "Helios Artillery",
    telegraphSet: ["burst", "volley", "sweep"],
    phaseRules: [
      { phase: 1, hpRatioThreshold: 1, threatLevel: "medium", punishWindowSec: 1.6 },
      { phase: 2, hpRatioThreshold: 0.66, threatLevel: "high", punishWindowSec: 1.35 },
      { phase: 3, hpRatioThreshold: 0.33, threatLevel: "critical", punishWindowSec: 1.05 },
    ],
    attackPatterns: [
      { phase: 1, attacks: ["burst"] },
      { phase: 2, attacks: ["burst", "volley"] },
      { phase: 3, attacks: ["burst", "sweep", "volley"] },
    ],
    breakpoints: [0.66, 0.33],
    punishWindows: [1.6, 1.35, 1.05],
    arenaEffects: ["turret_crossfire", "warning_lane", "punish_window"],
    projectileSkin: "plasma_bolt",
    cancelReward: 140,
    phaseScoreRules: [
      { phase: 1, bonusPerWeakHit: 35 },
      { phase: 2, bonusPerWeakHit: 50 },
      { phase: 3, bonusPerWeakHit: 70 },
    ],
  },
  final_core: {
    profile: "final_core",
    label: "Citadel Core",
    telegraphSet: ["volley", "sweep", "gate_sweep", "summon"],
    phaseRules: [
      { phase: 1, hpRatioThreshold: 1, threatLevel: "high", punishWindowSec: 1.45 },
      { phase: 2, hpRatioThreshold: 0.66, threatLevel: "high", punishWindowSec: 1.2 },
      { phase: 3, hpRatioThreshold: 0.33, threatLevel: "critical", punishWindowSec: 0.95 },
    ],
    attackPatterns: [
      { phase: 1, attacks: ["volley", "summon"] },
      { phase: 2, attacks: ["gate_sweep", "volley", "summon"] },
      { phase: 3, attacks: ["sweep", "gate_sweep", "volley"] },
    ],
    breakpoints: [0.66, 0.33],
    punishWindows: [1.45, 1.2, 0.95],
    arenaEffects: ["boss_phase_shift", "warning_lane", "stage_breakthrough"],
    projectileSkin: "void_core",
    cancelReward: 160,
    phaseScoreRules: [
      { phase: 1, bonusPerWeakHit: 45 },
      { phase: 2, bonusPerWeakHit: 65 },
      { phase: 3, bonusPerWeakHit: 90 },
    ],
  },
  ex_overlord: {
    profile: "ex_overlord",
    label: "Overlord Prime",
    telegraphSet: ["burst", "volley", "sweep", "gate_sweep", "summon"],
    phaseRules: [
      { phase: 1, hpRatioThreshold: 1, threatLevel: "high", punishWindowSec: 1.2 },
      { phase: 2, hpRatioThreshold: 0.66, threatLevel: "critical", punishWindowSec: 1.0 },
      { phase: 3, hpRatioThreshold: 0.33, threatLevel: "critical", punishWindowSec: 0.8 },
    ],
    attackPatterns: [
      { phase: 1, attacks: ["burst", "summon"] },
      { phase: 2, attacks: ["burst", "gate_sweep", "volley"] },
      { phase: 3, attacks: ["sweep", "gate_sweep", "burst", "volley"] },
    ],
    breakpoints: [0.66, 0.33],
    punishWindows: [1.2, 1.0, 0.8],
    arenaEffects: ["boss_phase_shift", "warning_lane", "hazard_surge", "stage_breakthrough"],
    projectileSkin: "void_core",
    cancelReward: 180,
    phaseScoreRules: [
      { phase: 1, bonusPerWeakHit: 55 },
      { phase: 2, bonusPerWeakHit: 80 },
      { phase: 3, bonusPerWeakHit: 110 },
    ],
  },
};

export function getBossDefinition(profile: EncounterProfile): BossDefinition | null {
  return BOSS_DEFINITIONS[profile] ?? null;
}
