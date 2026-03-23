declare module "culori" {
  interface CuloriColor {
    alpha?: number;
    [channel: string]: number | string | undefined;
  }

  export function formatHex(color: unknown): string | undefined;
  export function formatRgb(color: CuloriColor): string;
  export function interpolate(
    colors: readonly string[],
    mode?: string,
  ): (progress: number) => unknown;
  export function parse(color: string): CuloriColor | undefined;
}
