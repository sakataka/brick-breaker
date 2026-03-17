import type { BrickKind, ItemType, ScoreFocus, StageBonusRule, Vector2 } from "../domainTypes";

export interface Particle {
  pos: Vector2;
  vel: Vector2;
  lifeMs: number;
  maxLifeMs: number;
  size: number;
  color: string;
}

export interface ImpactRing {
  pos: Vector2;
  radiusStart: number;
  radiusEnd: number;
  lifeMs: number;
  maxLifeMs: number;
  color: string;
}

export type FloatingTextKey =
  | "item_pickup"
  | "reinforce"
  | "generator"
  | "gate"
  | "turret"
  | "split"
  | "summon"
  | "thorns"
  | "spell"
  | "boss_phase_2"
  | "boss_phase_3"
  | "boss_warning";

export interface FloatingText {
  key: FloatingTextKey;
  itemType?: ItemType;
  pos: Vector2;
  lifeMs: number;
  maxLifeMs: number;
  color: string;
}

export interface VfxState {
  particles: Particle[];
  impactRings: ImpactRing[];
  floatingTexts: FloatingText[];
  flashMs: number;
  flashColor: string;
  shakeMs: number;
  shakePx: number;
  hitFreezeMs: number;
  shakeOffset: Vector2;
  trail: Vector2[];
  densityScale: number;
  reducedMotion: boolean;
  pickupAuraMs: number;
  pickupAuraColor: string;
  pickupToast: {
    itemType: ItemType;
    color: string;
    lifeMs: number;
    maxLifeMs: number;
  } | null;
}

export type CollisionEventKind = "wall" | "paddle" | "brick" | "miss";

export interface CollisionEvent {
  kind: CollisionEventKind;
  x: number;
  y: number;
  color?: string;
  brickKind?: BrickKind;
  brickId?: number;
}

export interface ScoreFeedEntry {
  id: number;
  label: string;
  amount: number;
  lifeMs: number;
  maxLifeMs: number;
  tone: "score" | "style" | "record";
}

export interface StyleBonusState {
  stageFocus: ScoreFocus;
  bonusRules: readonly StageBonusRule[];
  chainLevel: number;
  lastBonusLabel: string | null;
  lastBonusScore: number;
  noDropChainActive: boolean;
}

export type RuntimeErrorKey =
  | "initialization"
  | "gameStart"
  | "startAction"
  | "shopPurchase"
  | "runtime";

export interface A11yState {
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface UiProjectionSource {
  vfx: VfxState;
  a11y: A11yState;
  scoreFeed: ScoreFeedEntry[];
  styleBonus: StyleBonusState;
  error: {
    key: RuntimeErrorKey;
    detail?: string;
  } | null;
}
