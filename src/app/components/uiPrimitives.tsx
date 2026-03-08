import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties, ElementType, ReactElement, ReactNode } from "react";
import type { MotionProfile, WarningLevel } from "../../game/uiTheme";

interface MotionConfig {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
  transition: {
    duration: number;
    ease: [number, number, number, number] | "linear";
  };
}

export interface SurfaceProps {
  as?: ElementType;
  id?: string;
  className?: string;
  emphasis?: "default" | "accent" | "danger";
  chrome?: "panel" | "boss" | "warning";
  elevated?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export interface BannerProps {
  visible: boolean;
  className?: string;
  title: string;
  eyebrow: string;
  icon?: ReactNode;
  chrome?: "panel" | "boss" | "warning";
  warningLevel?: WarningLevel;
  motionProfile: MotionProfile;
  children?: ReactNode;
}

export interface StatChipProps {
  icon: ReactNode;
  label: string;
  value: string;
  emphasis?: "default" | "accent" | "danger";
  id?: string;
  valueRef?: React.RefObject<HTMLSpanElement | null>;
}

export interface ProgressBarProps {
  value: number;
  id?: string;
}

export interface IconLabelProps {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface OptionCardProps {
  className?: string;
  active?: boolean;
  disabled?: boolean;
  accent?: string;
  children: ReactNode;
}

export interface DangerPillProps {
  icon?: ReactNode;
  children: ReactNode;
  warningLevel?: WarningLevel;
}

const FULL_MOTION: MotionConfig = {
  initial: { opacity: 0, y: 14, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
  transition: {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
  },
};

const REDUCED_MOTION: MotionConfig = {
  initial: { opacity: 0, y: 0, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 0, scale: 0.995 },
  transition: {
    duration: 0.16,
    ease: "linear",
  },
};

export function Surface({
  as: Component = "section",
  id,
  className,
  emphasis = "default",
  chrome = "panel",
  elevated = false,
  children,
  style,
}: SurfaceProps): ReactElement {
  return (
    <Component
      id={id}
      className={clsx("ui-surface", className, `ui-surface-${emphasis}`, {
        "ui-surface-elevated": elevated,
        [`ui-surface-chrome-${chrome}`]: true,
      })}
      style={style}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, icon }: SectionHeaderProps): ReactElement {
  return (
    <div className="ui-section-header">
      {icon ? <span className="ui-section-header-icon">{icon}</span> : null}
      <div className="ui-section-header-copy">
        {eyebrow ? <p className="ui-section-eyebrow">{eyebrow}</p> : null}
        <h2 className="ui-section-title">{title}</h2>
        {subtitle ? <p className="ui-section-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function Banner({
  visible,
  className,
  title,
  eyebrow,
  icon,
  chrome = "panel",
  warningLevel = "calm",
  motionProfile,
  children,
}: BannerProps): ReactElement {
  const motionConfig = motionProfile === "reduced" ? REDUCED_MOTION : FULL_MOTION;
  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          className={clsx("ui-banner", className, `ui-banner-${warningLevel}`, `ui-banner-chrome-${chrome}`)}
          initial={motionConfig.initial}
          animate={motionConfig.animate}
          exit={motionConfig.exit}
          transition={motionConfig.transition}
        >
          {icon ? <span className="ui-banner-icon">{icon}</span> : null}
          <div className="ui-banner-copy">
            <span className="ui-banner-eyebrow">{eyebrow}</span>
            <strong className="ui-banner-title">{title}</strong>
            {children ? <div className="ui-banner-extra">{children}</div> : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function StatChip({
  icon,
  label,
  value,
  emphasis = "default",
  id,
  valueRef,
}: StatChipProps): ReactElement {
  return (
    <div id={id} className={clsx("ui-stat-chip", `ui-stat-chip-${emphasis}`)}>
      <span className="ui-stat-chip-icon">{icon}</span>
      <span className="ui-stat-chip-label">{label}</span>
      <strong ref={valueRef} className="ui-stat-chip-value">
        {value}
      </strong>
    </div>
  );
}

export function ProgressBar({ value, id }: ProgressBarProps): ReactElement {
  return (
    <div id={id} className="ui-progress-track" aria-hidden="true">
      <div className="ui-progress-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function IconLabel({ icon, children, className }: IconLabelProps): ReactElement {
  return (
    <span className={clsx("ui-icon-label", className)}>
      <span className="ui-icon-label-icon">{icon}</span>
      <span className="ui-icon-label-copy">{children}</span>
    </span>
  );
}

export function OptionCard({
  className,
  active = false,
  disabled = false,
  accent,
  children,
}: OptionCardProps): ReactElement {
  return (
    <div
      className={clsx("ui-option-card", className, {
        "ui-option-card-active": active,
        "ui-option-card-disabled": disabled,
      })}
      style={accent ? ({ "--card-accent": accent } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export function DangerPill({ icon, children, warningLevel = "elevated" }: DangerPillProps): ReactElement {
  return (
    <span className={clsx("ui-danger-pill", `ui-danger-pill-${warningLevel}`)}>
      {icon ? <span className="ui-danger-pill-icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
