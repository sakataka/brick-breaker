const START_KEYS = [" ", "enter"] as const;
const PAUSE_KEYS = ["p"] as const;

const isStartKey = (key: string): boolean => START_KEYS.includes(key as (typeof START_KEYS)[number]);
const isPauseKey = (key: string): boolean => PAUSE_KEYS.includes(key as (typeof PAUSE_KEYS)[number]);

export interface InputHandlers {
  moveByMouseX: (clientX: number) => void;
  pauseToggle: () => void;
  startOrRestart: () => void;
  castMagic: () => void;
  resize: () => void;
}

export class InputController {
  constructor(private readonly handlers: InputHandlers) {}

  attach(): void {
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("contextmenu", this.handleContextMenu);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("resize", this.handlers.resize);
  }

  detach(): void {
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("contextmenu", this.handleContextMenu);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("resize", this.handlers.resize);
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.handlers.moveByMouseX(event.clientX);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.handlers.moveByMouseX(event.clientX);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button === 2) {
      event.preventDefault();
      this.handlers.castMagic();
    }
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    if (isPauseKey(key)) {
      this.handlers.pauseToggle();
      return;
    }

    if (isStartKey(key)) {
      this.handlers.startOrRestart();
    }
  };
}
