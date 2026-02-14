import type { ReactElement } from "react";
import type { ShopViewState } from "../store";

export interface ShopPanelProps {
  shop: ShopViewState;
  onSelect: (index: 0 | 1) => void;
}

export function ShopPanel({ shop, onSelect }: ShopPanelProps): ReactElement {
  return (
    <div id="shop-panel" className={shop.visible ? "shop-panel" : "shop-panel panel-hidden"}>
      <p id="shop-status">{shop.status}</p>
      <div className="shop-buttons">
        <button
          id="shop-option-a"
          type="button"
          disabled={shop.optionADisabled}
          onClick={() => {
            onSelect(0);
          }}
        >
          {shop.optionALabel}
        </button>
        <button
          id="shop-option-b"
          type="button"
          disabled={shop.optionBDisabled}
          onClick={() => {
            onSelect(1);
          }}
        >
          {shop.optionBLabel}
        </button>
      </div>
    </div>
  );
}
