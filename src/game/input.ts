export interface InputHandlers {
  moveByMouseX: (clientX: number) => void;
  pauseToggle: () => void;
  startOrRestart: () => void;
  resize: () => void;
}

export class InputController {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly handlers: InputHandlers,
  ) {}

  attach(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('resize', this.handlers.resize);
  }

  detach(): void {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handlers.resize);
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.handlers.moveByMouseX(event.clientX);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    if (key === 'p') {
      this.handlers.pauseToggle();
      return;
    }

    if (key === ' ' || key === 'enter') {
      this.handlers.startOrRestart();
    }
  };
}
