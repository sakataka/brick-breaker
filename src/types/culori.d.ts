declare module "culori" {
  export type CuloriColor = {
    alpha?: number;
    mode?: string;
    [key: string]: number | string | undefined;
  };

  export function formatHex(color: string | CuloriColor): string | undefined;
  export function formatRgb(color: CuloriColor): string;
  export function interpolate(colors: readonly string[], mode?: string): (t: number) => string;
  export function parse(color: string): CuloriColor | undefined;
}
