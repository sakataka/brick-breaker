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
      {shop.previewStageNumber ? (
        <p className="shop-preview-line">
          {locale === "ja"
            ? `NEXT STAGE ${shop.previewStageNumber}: ${formatScoreFocus(locale, shop.previewFocus)} / ${shop.previewTags.map((tag) => formatPreviewTag(locale, tag)).join(" / ")}`
            : `NEXT STAGE ${shop.previewStageNumber}: ${formatScoreFocus(locale, shop.previewFocus)} / ${shop.previewTags.map((tag) => formatPreviewTag(locale, tag)).join(" / ")}`}
        </p>
      ) : null}
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
              <span>
                <strong>{optionALabel}</strong>
                <small>{formatOptionTags(locale, shop.optionA.previewAffinity)}</small>
              </span>
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
              <span>
                <strong>{optionBLabel}</strong>
                <small>{formatOptionTags(locale, shop.optionB.previewAffinity)}</small>
              </span>
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

function formatOptionTags(locale: AppLocale, tags: readonly string[]): string {
  return tags
    .slice(0, 2)
    .map((tag) => formatPreviewTag(locale, tag))
    .join(" / ");
}

function formatPreviewTag(locale: AppLocale, tag: string): string {
  const labels: Record<string, { ja: string; en: string }> = {
    shielded_grid: { ja: "遮蔽グリッド", en: "Shield Grid" },
    relay_chain: { ja: "中継連鎖", en: "Relay Chain" },
    reactor_chain: { ja: "炉心連鎖", en: "Reactor Chain" },
    turret_lane: { ja: "砲撃レーン", en: "Turret Lane" },
    hazard_flux: { ja: "乱流域", en: "Flux Hazard" },
    gate_pressure: { ja: "ゲート圧迫", en: "Gate Pressure" },
    boss_break: { ja: "ボス破壊", en: "Boss Break" },
    survival_check: { ja: "生存重視", en: "Survival" },
    fortress_core: { ja: "要塞コア", en: "Fortress Core" },
    sweep_alert: { ja: "掃射警戒", en: "Sweep Alert" },
  };
  const entry = labels[tag];
  return locale === "ja" ? (entry?.ja ?? tag) : (entry?.en ?? tag);
}

function formatScoreFocus(locale: AppLocale, focus: ShopUiView["previewFocus"]): string {
  if (!focus) {
    return locale === "ja" ? "稼ぎ準備" : "Score Prep";
  }
  const labels: Record<NonNullable<ShopUiView["previewFocus"]>, { ja: string; en: string }> = {
    reactor_chain: { ja: "連鎖稼ぎ", en: "Chain Score" },
    turret_cancel: { ja: "弾消し稼ぎ", en: "Cancel Score" },
    boss_break: { ja: "ブレイク稼ぎ", en: "Break Score" },
    survival_chain: { ja: "ノーミス稼ぎ", en: "Survival Score" },
  };
  return locale === "ja" ? labels[focus].ja : labels[focus].en;
}
