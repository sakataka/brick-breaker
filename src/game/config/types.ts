import type { ItemType } from "../types";

export interface ItemRule {
  type: ItemType;
  weight: number;
  label: string;
}
