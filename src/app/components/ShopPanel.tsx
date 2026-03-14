import type { CSSProperties, ReactElement } from "react";
import type { ShopUiView } from "../../game/shopUi";
import { type AppLocale, formatPoints, getItemTranslation, getLL } from "../../i18n";
import { AppIcon } from "./AppIcon";
import { getItemVisualSpec } from "./itemVisualRegistry";
import { OptionCard, SectionHeader, Surface } from "./uiPrimitives";

export interface ShopPanelProps {
  locale: AppLocale;
  shop: ShopUiView;
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
  const optionAVisual = shop.optionAType ? getItemVisualSpec(shop.optionAType) : null;
  const optionBVisual = shop.optionBType ? getItemVisualSpec(shop.optionBType) : null;
  const priceBand = shop.cost >= 2200 ? "HIGH" : shop.cost >= 1600 ? "MID" : "LOW";

  return (
    <Surface id="shop-panel" className={className} emphasis="accent" chrome="panel" elevated>
      <SectionHeader
        eyebrow="SHOP LINK"
        title={statusText}
        subtitle={`${LL.shop.price()}: ${formatPoints(locale, shop.cost)}`}
      />
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
          <OptionCard
            active={!shop.optionADisabled}
            disabled={shop.optionADisabled}
            accent={optionAVisual?.accent}
          >
            <span className="shop-option-copy">
              {optionAVisual ? (
                <AppIcon name={optionAVisual.icon} className="shop-option-icon" />
              ) : null}
              <span>{optionALabel}</span>
            </span>
          </OptionCard>
        </button>
        <button
          id="shop-option-b"
          type="button"
          disabled={shop.optionBDisabled}
          onClick={() => {
            onSelect(1);
          }}
        >
          <OptionCard
            active={!shop.optionBDisabled}
            disabled={shop.optionBDisabled}
            accent={optionBVisual?.accent}
          >
            <span className="shop-option-copy">
              {optionBVisual ? (
                <AppIcon name={optionBVisual.icon} className="shop-option-icon" />
              ) : null}
              <span>{optionBLabel}</span>
            </span>
          </OptionCard>
        </button>
      </div>
      <p
        id="shop-status"
        className="shop-status-copy"
        style={
          {
            "--shop-accent": optionAVisual?.accent ?? optionBVisual?.accent ?? "#ffb15c",
          } as CSSProperties
        }
      >
        {statusText}
      </p>
    </Surface>
  );
}
