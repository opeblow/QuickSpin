export type GamePhase = "idle" | "running" | "paused" | "finished";

export interface GameResult {
  /** Normalized score — every game should produce something comparable. */
  score: number;
  /** Human readable score for display. */
  label: string;
  /** Extra info shown on the finish screen, e.g. "3 streaks", "New high". */
  notes: string[];
}

/** What a single playable game exposes to the widget chassis. */
export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  /** How to draw/control the game. Implementations build into the canvas owner. */
  create(host: GameHost): GameInstance;
}

export interface GameHost {
  /** Canvas element the game can draw into. */
  canvas: HTMLCanvasElement;
  /** Current wait progress 0..1 (0 = just started, 1 = AI done). */
  progress: number;
  /** Live model status text ("Reasoning…", "Generating…"). */
  status: string;
  /** Called by the game to signal it finished (or timed out). */
  finish(result: GameResult): void;
}

export interface GameInstance {
  start(): void;
  /** Called exactly once per animation frame while running. */
  tick(time: number, dt: number): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface WidgetOptions {
  /** Element to mount into, or CSS selector. Defaults to [data-waiting-widget]. */
  target?: string | HTMLElement;
  gameId?: string;
  /** Called with progress updates from the host app if it doesn't provide them. */
  onProgress?: (p: number) => void;
  theme?: "dark" | "light";
  /** Callback when the widget requests a checkout (Vault/payment hook). */
  onCheckout?: (plan: string) => void;
}

export interface WaitingController {
  /** Set wait progress 0..1 from the host app. */
  progress(p: number, status?: string): void;
  /** Mark the wait over — hides the widget / shows the handoff. */
  done(): void;
  /** Force show/hide. */
  show(visible: boolean): void;
  startGame(id?: string): void;
  destroy(): void;
}
