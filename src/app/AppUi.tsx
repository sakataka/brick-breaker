import { type ReactElement, useEffect, useRef } from "react";
import { HudPanel } from "./components/HudPanel";
import { OverlayRoot } from "./components/OverlayRoot";
import { ShopPanel } from "./components/ShopPanel";
import { useAppStore } from "./store";

export function AppUi(): ReactElement {
  const hud = useAppStore((state) => state.hud);
  const overlay = useAppStore((state) => state.overlay.model);
  const shop = useAppStore((state) => state.shop);
  const startSettings = useAppStore((state) => state.startSettings);
  const rogueSelection = useAppStore((state) => state.rogueSelection);
  const setStartSettings = useAppStore((state) => state.setStartSettings);
  const setRogueSelection = useAppStore((state) => state.setRogueSelection);
  const triggerPrimaryAction = useAppStore((state) => state.triggerPrimaryAction);
  const triggerShopOption = useAppStore((state) => state.triggerShopOption);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const lastScoreRef = useRef(0);
  const playLayoutActive = overlay.scene === "playing" || overlay.scene === "paused";

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
    return () => {
      stageWrap.classList.remove("layout-play");
    };
  }, [playLayoutActive]);

  return (
    <>
      <div id="play-topbar" className={playLayoutActive ? "play-topbar active" : "play-topbar"}>
        <HudPanel hud={hud} scoreRef={scoreRef} />
        <ShopPanel
          shop={shop}
          onSelect={(index) => {
            triggerShopOption(index);
          }}
        />
      </div>
      <OverlayRoot
        overlay={overlay}
        startSettings={startSettings}
        rogueSelection={rogueSelection}
        onStartSettingsChange={setStartSettings}
        onRogueSelectionChange={setRogueSelection}
        onPrimaryAction={triggerPrimaryAction}
      />
    </>
  );
}
