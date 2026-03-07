import type { ReactElement } from "react";
import { getItemEmoji } from "../../game/itemRegistry";
import { type AppLocale, formatPoints, getItemTranslation, getLL } from "../../i18n";
import type { ShopViewState } from "../store";

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
    shop.optionAType === null
      ? LL.shop.choiceA()
      : `${getItemEmoji(shop.optionAType)} ${getItemTranslation(LL, shop.optionAType).name()}`;
  const optionBLabel =
    shop.optionBType === null
      ? LL.shop.choiceB()
      : `${getItemEmoji(shop.optionBType)} ${getItemTranslation(LL, shop.optionBType).name()}`;

  return (
    <div id="shop-panel" className={className}>
      <p id="shop-status">{statusText}</p>
      <p id="shop-cost">
        {LL.shop.price()}: {formatPoints(locale, shop.cost)}
      </p>
      {shop.priceBandVisible ? <p id="shop-price-band">-</p> : null}
      <div className="shop-buttons">
        <button
          id="shop-option-a"
          type="button"
          disabled={shop.optionADisabled}
          onClick={() => {
            onSelect(0);
          }}
        >
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
          {optionBLabel}
        </button>
      </div>
    </div>
  );
}
