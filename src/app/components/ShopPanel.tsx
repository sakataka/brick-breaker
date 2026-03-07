import type { ReactElement } from "react";
import { type AppLocale, formatPoints, getItemTranslation, getLL } from "../../i18n";
import type { ShopViewState } from "../store";
import { GameIcon } from "./GameIcon";

export interface ShopPanelProps {
  locale: AppLocale;
  shop: ShopViewState;
  onSelect: (index: 0 | 1) => void;
}

export function ShopPanel({ locale, shop, onSelect }: ShopPanelProps): ReactElement {
  const LL = getLL(locale);
  const className = shop.visible ? "shop-panel" : "shop-panel shop-panel-hidden";
  const statusText =
    shop.status === "purchased"
      ? LL.shop.status.purchased()
      : shop.status === "one_time"
        ? LL.shop.status.oneTime()
        : LL.shop.title();
  const optionALabel =
    shop.optionAType === null ? LL.shop.choiceA() : getItemTranslation(LL, shop.optionAType).name();
  const optionBLabel =
    shop.optionBType === null ? LL.shop.choiceB() : getItemTranslation(LL, shop.optionBType).name();
  const priceBand = shop.cost >= 2200 ? "HIGH" : shop.cost >= 1600 ? "MID" : "LOW";

  return (
    <div id="shop-panel" className={className}>
      <p id="shop-status">{statusText}</p>
      <p id="shop-cost">
        {LL.shop.price()}: {formatPoints(locale, shop.cost)}
      </p>
      {shop.priceBandVisible ? <p id="shop-price-band">{priceBand}</p> : null}
      <div className="shop-buttons">
        <button
          id="shop-option-a"
          type="button"
          disabled={shop.optionADisabled}
          onClick={() => {
            onSelect(0);
          }}
        >
          {shop.optionAType ? <GameIcon name={shop.optionAType} className="shop-option-icon" /> : null}
          {optionALabel}
        </button>
        <button
          id="shop-option-b"
          type="button"
          disabled={shop.optionBDisabled}
          onClick={() => {
            onSelect(1);
          }}
        >
          {shop.optionBType ? <GameIcon name={shop.optionBType} className="shop-option-icon" /> : null}
          {optionBLabel}
        </button>
      </div>
    </div>
  );
}
