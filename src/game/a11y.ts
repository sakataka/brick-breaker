export interface AccessibilitySnapshot {
  reducedMotion: boolean;
  highContrast: boolean;
}

export function readAccessibility(windowRef: Window): AccessibilitySnapshot {
  return {
    reducedMotion: windowRef.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: windowRef.matchMedia("(prefers-contrast: more)").matches,
  };
}
