export class LifecycleController {
  private resizeObserver: ResizeObserver | null = null;
  private bound = false;

  constructor(
    private readonly documentRef: Document,
    private readonly stageWrap: HTMLElement | null,
    private readonly onVisibilityHidden: () => void,
    private readonly onResize: () => void,
  ) {}

  bind(): void {
    if (this.bound) {
      return;
    }
    this.bound = true;

    this.documentRef.addEventListener("visibilitychange", this.handleVisibilityChange);
    if (typeof ResizeObserver !== "undefined" && this.stageWrap) {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.stageWrap);
    }
  }

  unbind(): void {
    if (!this.bound) {
      return;
    }
    this.bound = false;
    this.documentRef.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.documentRef.visibilityState === "hidden") {
      this.onVisibilityHidden();
    }
  };
}
