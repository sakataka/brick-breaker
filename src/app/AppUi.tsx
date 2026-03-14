import { type CSSProperties, type ReactElement, useEffect, useRef } from "react";
import { getArtCssVars, resolveVisualAssetProfile } from "../art/visualAssets";
import { HudPanel } from "./components/HudPanel";
import { OverlayRoot } from "./components/OverlayRoot";
import { ShopPanel } from "./components/ShopPanel";
import { useAppStore } from "./store";

export function AppUi(): ReactElement {
  const locale = useAppStore((state) => state.locale);
  const hud = useAppStore((state) => state.hud);
  const overlay = useAppStore((state) => state.overlay.model);
  const shop = useAppStore((state) => state.shop);
  const startSettings = useAppStore((state) => state.startSettings);
  const metaProgress = useAppStore((state) => state.metaProgress);
  const rogueSelection = useAppStore((state) => state.rogueSelection);
  const setStartSettings = useAppStore((state) => state.setStartSettings);
  const setLocale = useAppStore((state) => state.setLocale);
  const setRogueSelection = useAppStore((state) => state.setRogueSelection);
  const triggerPrimaryAction = useAppStore((state) => state.triggerPrimaryAction);
  const triggerShopOption = useAppStore((state) => state.triggerShopOption);
  const scoreRef = useRef<HTMLElement>(null);
  const lastScoreRef = useRef(0);
  const playLayoutActive = overlay.scene === "playing" || overlay.scene === "paused";
  const topbarArtProfile = resolveVisualAssetProfile(
    hud.visual.assetProfileId,
    hud.visual.warningLevel,
    hud.visual.encounterEmphasis,
  );
  const topbarArtVars = getArtCssVars(topbarArtProfile) as CSSProperties;

  useEffect(() => {
    const element = scoreRef.current;
    if (!element) {
      lastScoreRef.current = overlay.score;
      return;
    }
    const gain = overlay.score - lastScoreRef.current;
    if (gain > 0) {
      element.classList.remove("pop", "pop-large");
      void element.offsetWidth;
      element.classList.add("pop");
      if (gain >= 300) {
        element.classList.add("pop-large");
      }
      lastScoreRef.current = overlay.score;
      const timer = setTimeout(() => {
        element.classList.remove("pop", "pop-large");
      }, 130);
      return () => {
        clearTimeout(timer);
      };
    }
    lastScoreRef.current = overlay.score;
    return undefined;
  }, [overlay.score]);

  useEffect(() => {
    const stageWrap = document.getElementById("stage-wrap");
    if (!stageWrap) {
      return;
    }
    stageWrap.classList.toggle("layout-play", playLayoutActive);
    stageWrap.setAttribute("data-theme", hud.visual.themeId);
    stageWrap.setAttribute("data-warning", hud.visual.warningLevel);
    stageWrap.style.setProperty("--stage-accent", hud.visual.tokens.accent);
    stageWrap.style.setProperty("--stage-danger", hud.visual.tokens.danger);
    stageWrap.style.setProperty("--stage-backdrop", hud.visual.tokens.backdrop);
    stageWrap.style.setProperty("--stage-backdrop-top", hud.visual.tokens.backdropTop);
    stageWrap.style.setProperty("--stage-frame", hud.visual.tokens.frame);
    stageWrap.style.setProperty("--stage-pattern", hud.visual.tokens.pattern);
    const artVars = getArtCssVars(topbarArtProfile);
    for (const [key, value] of Object.entries(artVars)) {
      stageWrap.style.setProperty(key, value);
    }
    return () => {
      stageWrap.classList.remove("layout-play");
      stageWrap.removeAttribute("data-theme");
      stageWrap.removeAttribute("data-warning");
      stageWrap.style.removeProperty("--stage-accent");
      stageWrap.style.removeProperty("--stage-danger");
      stageWrap.style.removeProperty("--stage-backdrop");
      stageWrap.style.removeProperty("--stage-backdrop-top");
      stageWrap.style.removeProperty("--stage-frame");
      stageWrap.style.removeProperty("--stage-pattern");
      for (const key of Object.keys(artVars)) {
        stageWrap.style.removeProperty(key);
      }
    };
  }, [
    hud.visual.themeId,
    hud.visual.tokens,
    hud.visual.warningLevel,
    playLayoutActive,
    topbarArtProfile,
  ]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <div
        id="play-topbar"
        className={playLayoutActive ? "play-topbar active" : "play-topbar"}
        style={topbarArtVars}
      >
        <HudPanel locale={locale} hud={hud} scoreRef={scoreRef} />
        <ShopPanel
          locale={locale}
          shop={shop}
          onSelect={(index) => {
            triggerShopOption(index);
          }}
        />
      </div>
      <OverlayRoot
        locale={locale}
        overlay={overlay}
        startSettings={startSettings}
        exUnlocked={metaProgress.exUnlocked}
        rogueSelection={rogueSelection}
        onStartSettingsChange={setStartSettings}
        onLocaleChange={setLocale}
        onRogueSelectionChange={setRogueSelection}
        onPrimaryAction={triggerPrimaryAction}
      />
    </>
  );
}
