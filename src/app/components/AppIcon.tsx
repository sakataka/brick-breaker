import {
  ArrowsOutLineHorizontal,
  Bomb,
  Broadcast,
  CirclesThree,
  CompassRose,
  CrosshairSimple,
  Heart,
  HourglassLow,
  type Icon,
  type IconProps,
  Lightning,
  Pulse,
  Shield,
  Skull,
  Sword,
  Timer,
  TrendUp,
  Trophy,
  WarningOctagon,
  Waveform,
} from "@phosphor-icons/react";
import type { ReactElement } from "react";
import type { ItemType } from "../../game-v2/public/types";

export type AppIconName =
  | ItemType
  | "score"
  | "lives"
  | "time"
  | "combo"
  | "cast"
  | "boss"
  | "warning";

const ICON_MAP: Record<AppIconName, Icon> = {
  paddle_plus: ArrowsOutLineHorizontal,
  slow_ball: HourglassLow,
  multiball: CirclesThree,
  shield: Shield,
  pierce: Sword,
  bomb: Bomb,
  laser: CrosshairSimple,
  homing: CompassRose,
  rail: Lightning,
  shockwave: Waveform,
  pulse: Pulse,
  score: Trophy,
  lives: Heart,
  time: Timer,
  combo: TrendUp,
  cast: Broadcast,
  boss: Skull,
  warning: WarningOctagon,
};

export interface AppIconProps extends Omit<IconProps, "children"> {
  name: AppIconName;
}

export function AppIcon({
  name,
  size = 18,
  weight = "duotone",
  ...props
}: AppIconProps): ReactElement {
  const Component = ICON_MAP[name] ?? Skull;
  return <Component aria-hidden="true" size={size} weight={weight} {...props} />;
}
