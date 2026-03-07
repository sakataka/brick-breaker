import { i18nObject } from "typesafe-i18n";
import type { ItemType, RogueUpgradeType, StageMissionKey } from "../game/types";
import { translationCatalog } from "./translations";

export const supportedLocales = ["ja", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export type AppLocale = SupportedLocale;

const STORAGE_KEY = "brick_breaker:locale";
const localeCache = new Map<AppLocale, LL>();
let currentLocale: AppLocale = "ja";

function createTranslator(locale: AppLocale) {
  return i18nObject(locale, translationCatalog[locale]);
}

export type LL = ReturnType<typeof createTranslator>;

export function getLocaleStorageKey(): string {
  return STORAGE_KEY;
}

export function isAppLocale(value: string): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function resolveStoredLocale(storage: Pick<Storage, "getItem"> | null | undefined): AppLocale | null {
  const stored = storage?.getItem(STORAGE_KEY);
  return stored && isSupportedLocale(stored) ? stored : null;
}

export function resolveBrowserLocale(
  navigatorRef: Pick<Navigator, "language" | "languages"> | null | undefined,
): SupportedLocale {
  const candidates = navigatorRef?.languages?.length
    ? navigatorRef.languages
    : [navigatorRef?.language ?? ""];
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    if (normalized.startsWith("ja")) {
      return "ja";
    }
    if (normalized.startsWith("en")) {
      return "en";
    }
  }
  return "ja";
}

export function resolveInitialLocale(windowRef?: Window): AppLocale {
  const stored = resolveStoredLocale(windowRef?.localStorage);
  if (stored) {
    return stored;
  }
  return resolveBrowserLocale(windowRef?.navigator);
}

export function setCurrentLocale(locale: AppLocale, storage?: Pick<Storage, "setItem"> | null): void {
  currentLocale = locale;
  storage?.setItem(STORAGE_KEY, locale);
}

export function getCurrentLocale(): AppLocale {
  return currentLocale;
}

export function getLL(locale: AppLocale = currentLocale): LL {
  const cached = localeCache.get(locale);
  if (cached) {
    return cached;
  }
  const next = createTranslator(locale);
  localeCache.set(locale, next);
  return next;
}

export function initializeLocale(windowRef?: Window): AppLocale {
  const locale = resolveInitialLocale(windowRef);
  setCurrentLocale(locale);
  return locale;
}

export function formatInteger(locale: AppLocale, value: number): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(locale: AppLocale, value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatPoints(locale: AppLocale, value: number): string {
  const formatted = formatInteger(locale, value);
  return locale === "ja" ? `${formatted}点` : `${formatted} pts`;
}

export function getItemTranslation(LL: LL, itemType: ItemType) {
  return LL.items[itemType];
}

export function getRogueUpgradeLabel(LL: LL, upgrade: RogueUpgradeType): string {
  return LL.rogue[upgrade]();
}

export function getStageMissionLabel(LL: LL, key: StageMissionKey): string {
  return LL.stageMission[key]();
}

export function getIntlLocale(locale: AppLocale): string {
  return locale;
}
