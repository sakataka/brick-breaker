import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { ItemType } from "../../game/types";

export type GameIconName =
  | ItemType
  | "score"
  | "lives"
  | "time"
  | "combo"
  | "risk"
  | "overdrive"
  | "cast"
  | "boss"
  | "warning";

export interface GameIconProps {
  name: GameIconName;
  className?: string;
  accent?: string;
}

function getIconTitle(name: GameIconName): string {
  return name.replaceAll("_", " ");
}

function renderIconSvg(title: string, common: Record<string, unknown>, children: ReactNode): ReactElement {
  return (
    <svg {...common}>
      <title>{title}</title>
      {children}
    </svg>
  );
}

export function GameIcon({ name, className, accent }: GameIconProps): ReactElement {
  const stroke = accent ?? "currentColor";
  const title = getIconTitle(name);
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style: accent ? ({ color: accent } as CSSProperties) : undefined,
    "aria-hidden": true,
  };

  switch (name) {
    case "paddle_plus":
      return renderIconSvg(
        title,
        common,
        <>
          <rect x="4" y="15" width="16" height="3.5" rx="1.75" />
          <path d="M12 5v6" />
          <path d="M9 8h6" />
        </>,
      );
    case "slow_ball":
      return renderIconSvg(
        title,
        common,
        <>
          <circle cx="9" cy="12" r="4" />
          <path d="M15 10h5" />
          <path d="M17 14h3" />
        </>,
      );
    case "multiball":
      return renderIconSvg(
        title,
        common,
        <>
          <circle cx="8" cy="13" r="3.2" />
          <circle cx="15.5" cy="9" r="2.6" />
          <circle cx="16.2" cy="15.4" r="2.4" />
        </>,
      );
    case "shield":
      return renderIconSvg(
        title,
        common,
        <path d="M12 4l6 2.3v5.2c0 4.1-2.8 6.9-6 8.5-3.2-1.6-6-4.4-6-8.5V6.3L12 4z" />,
      );
    case "pierce":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M5 18L18 5" />
          <path d="M8 19l-3-3" />
          <path d="M17 8l2 2" />
        </>,
      );
    case "bomb":
      return renderIconSvg(
        title,
        common,
        <>
          <circle cx="11" cy="13" r="5" />
          <path d="M14.5 8.5l2.5-2.5" />
          <path d="M15.5 5.5h3" />
        </>,
      );
    case "shockwave":
      return renderIconSvg(title, common, <path d="M4 12h4l2-4 4 8 2-4h4" />);
    case "pulse":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M4 12h3l2-4 4 8 2-4h5" />
          <circle cx="18" cy="7" r="1.5" />
        </>,
      );
    case "decoy":
      return renderIconSvg(
        title,
        common,
        <>
          <circle cx="12" cy="12" r="5.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 3v2" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
        </>,
      );
    case "laser":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M5 18L19 6" />
          <path d="M13 6h6v6" />
        </>,
      );
    case "homing":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M5 12a7 7 0 1114 0" />
          <path d="M12 12l5-5" />
        </>,
      );
    case "rail":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M7 5v14" />
          <path d="M17 5v14" />
          <path d="M7 9h10" />
          <path d="M7 15h10" />
        </>,
      );
    case "score":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M6 18h12" />
          <path d="M8 18V8l4-3 4 3v10" />
        </>,
      );
    case "lives":
      return renderIconSvg(
        title,
        common,
        <path d="M12 20s-6-3.7-6-8.5c0-2.2 1.7-3.9 3.8-3.9 1.1 0 2.2.5 2.9 1.4.7-.9 1.8-1.4 2.9-1.4 2.1 0 3.8 1.7 3.8 3.9C18 16.3 12 20 12 20z" />,
      );
    case "time":
      return renderIconSvg(
        title,
        common,
        <>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4l3 2" />
        </>,
      );
    case "combo":
      return renderIconSvg(title, common, <path d="M5 16l4-8 4 8 3-5 3 5" />);
    case "risk":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M12 4l8 15H4L12 4z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.7" fill={stroke} />
        </>,
      );
    case "overdrive":
      return renderIconSvg(title, common, <path d="M12 4l-3 6h4l-2 10 6-9h-4l2-7z" />);
    case "cast":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M6 6h12v12H6z" />
          <path d="M6 12h12" />
        </>,
      );
    case "warning":
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M12 4l8 15H4L12 4z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.7" fill={stroke} />
        </>,
      );
    default:
      return renderIconSvg(
        title,
        common,
        <>
          <path d="M7 18l-2-7 3-1 1-4h6l1 4 3 1-2 7" />
          <path d="M10 12h.01" />
          <path d="M14 12h.01" />
          <path d="M9 15c1 .7 5 .7 6 0" />
        </>,
      );
  }
}
