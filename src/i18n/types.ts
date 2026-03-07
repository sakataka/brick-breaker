import type { ja } from "./ja";

type WidenTranslation<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly WidenTranslation<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: WidenTranslation<T[K]> }
      : T;

export type TranslationSchema = WidenTranslation<typeof ja>;
