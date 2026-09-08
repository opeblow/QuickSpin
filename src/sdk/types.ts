export type SessionStatus =
  | "idle"
  | "waiting"
  | "playing"
  | "response-ready"
  | "completed"
  | "cancelled"
  | "failed"
  | "destroyed";

export type EndReason = "ai-complete" | "player-failed" | "cancelled";

export interface GameResult {
  /** Actual gameplay score — never fabricated. */
  score: number;
  label: string;
  notes: string[];
  reason: EndReason;
}

export interface WaitMetrics {
  actualWaitMs: number;
  engagedPlayMs: number;
  gameId: string | null;
  score: number | null;
  feltWaitMs?: number | null;
}

export interface WaitEvent {
  type:
    | "session-start"
    | "phase"
    | "progress"
    | "game-start"
    | "score"
    | "session-complete"
    | "perceived-wait"
    | "cancel"
    | "fail";
  data?: unknown;
}

export type WaitEventHandler = (event: WaitEvent) => void;

export interface ThemeConfig {
  /** Light or dark game-stage palette. */
  mode?: "dark" | "light";
  primary?: string;
  surface?: string;
  /** Cards, buttons, elevated surfaces. */
  elevated?: string;
  /** The game canvas/stage surface. */
  game?: string;
  text?: string;
  muted?: string;
  border?: string;
  success?: string;
  radius?: string;
  font?: string;
}

export interface WaitSession {
  /** Update the visible AI phase label ("Drafting…"). */
  setPhase(phase: string): void;
  /**
   * Set progress 0..1. Passing nothing (or NaN) switches to an
   * indeterminate progress state — most hosts know the phase but not a
   * truthful percentage.
   */
  setProgress(value?: number): void;
  /** Mark the AI wait over and hand off to the response. */
  complete(): void;
  cancel(): void;
  fail(error?: unknown): void;
}

export interface QuickSpinController {
  start(options?: { gameId?: string; status?: string }): WaitSession;
  /**
   * Wrap an AI request: starts a session, streams through your phases, and
   * completes it when the promise resolves. Rejections call `fail`.
   */
  track<T>(request: Promise<T>, options?: { gameId?: string; status?: string }): Promise<T>;
  setTheme(theme: ThemeConfig): void;
  show(): void;
  hide(): void;
  destroy(): void;
  on(handler: WaitEventHandler): () => void;
  readonly status: SessionStatus;
}

export interface CreateQuickSpinOptions {
  target?: string | HTMLElement;
  game?: string;
  theme?: ThemeConfig;
  onEvent?: WaitEventHandler;
  /** Called with the chosen plan when a host page asks the user to check out. */
  onCheckout?: (planId: string) => Promise<{ ok: boolean; paymentId?: string }>;
}

export interface GameHost {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  /** Logical wait progress 0..1, or null when indeterminate. */
  progress: number | null;
  /** Summon a result from the running game for the given reason. */
  finish(reason: EndReason): GameResult;
  elapsedMs(): number;
}

export interface GameInstance {
  start(): void;
  /** Called by the controller's single animation loop (not a game-owned RAF). */
  tick(time: number, delta: number): void;
  /** Finalize a result for the reason given, always from live game state. */
  finish(reason: EndReason): GameResult;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  /** Instructions shown in the widget footer. */
  controls: string;
  create(host: GameHost): GameInstance;
}

export interface PlanOption {
  id: string;
  name: string;
  priceUsd: number;
  cadence: string;
  features: Array<string | { text: string; backlog: boolean }>;
  highlighted?: boolean;
  label: string;
}

export interface CheckoutResult {
  ok: boolean;
  planId: string;
  paymentId?: string;
  amountUsd: number;
}

export const GAME_NAME_IDS = ["runner", "orbit"] as const;
export type GameId = (typeof GAME_NAME_IDS)[number];
