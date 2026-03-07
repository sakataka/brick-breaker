import { en } from "./en";
import type { TranslationSchema } from "./types";

function pseudoifyText(value: string): string {
  const placeholders: string[] = [];
  const preserved = value.replace(/\{[^}]+\}/g, (match) => {
    const token = `__PSEUDO_${placeholders.length.toString()}__`;
    placeholders.push(match);
    return token;
  });

  const expanded = preserved
    .replace(/[aeiouAEIOU]/g, (char) => `${char}${char.toLowerCase()}`)
    .replace(/[A-Za-z]/g, (char) => {
      const map: Record<string, string> = {
        a: "à",
        b: "ƀ",
        c: "ç",
        d: "đ",
        e: "ë",
        f: "ƒ",
        g: "ğ",
        h: "ĥ",
        i: "ï",
        j: "ĵ",
        k: "ķ",
        l: "ľ",
        m: "m",
        n: "ñ",
        o: "õ",
        p: "ƥ",
        q: "ʠ",
        r: "ř",
        s: "š",
        t: "ŧ",
        u: "ü",
        v: "ṽ",
        w: "ŵ",
        x: "ẋ",
        y: "ÿ",
        z: "ž",
      };
      const lower = map[char.toLowerCase()] ?? char;
      return char === char.toUpperCase() ? lower.toUpperCase() : lower;
    });

  const restored = placeholders.reduce(
    (text, placeholder, index) => text.replace(`__PSEUDO_${index.toString()}__`, placeholder),
    expanded,
  );

  return `⟪${restored}⟫`;
}

function buildPseudoTranslation<T>(value: T): T {
  if (typeof value === "string") {
    return pseudoifyText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => buildPseudoTranslation(entry)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, buildPseudoTranslation(entry)]),
    ) as T;
  }
  return value;
}

export const pseudo: TranslationSchema = buildPseudoTranslation(en);
