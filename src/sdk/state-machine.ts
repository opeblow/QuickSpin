import type { SessionStatus, WaitEventHandler } from "./types";

const TERMINAL: ReadonlySet<SessionStatus> = new Set<SessionStatus>([
  "completed",
  "cancelled",
  "failed",
  "destroyed",
]);

const ALLOWED: Record<SessionStatus, ReadonlySet<SessionStatus>> = {
  idle: new Set<SessionStatus>(["waiting", "destroyed"]),
  waiting: new Set<SessionStatus>([
    "playing",
    "response-ready",
    "completed",
    "cancelled",
    "failed",
    "destroyed",
  ]),
  playing: new Set<SessionStatus>([
    "response-ready",
    "completed",
    "cancelled",
    "failed",
    "destroyed",
  ]),
  "response-ready": new Set<SessionStatus>([
    "completed",
    "playing",
    "cancelled",
    "failed",
    "destroyed",
  ]),
  completed: new Set<SessionStatus>(["idle", "destroyed"]),
  cancelled: new Set<SessionStatus>(["idle", "destroyed"]),
  failed: new Set<SessionStatus>(["idle", "destroyed"]),
  destroyed: new Set<SessionStatus>(),
};

export class SessionStateMachine {
  private _status: SessionStatus = "idle";
  private _progress: number | null = null;
  private _emit: WaitEventHandler;

  constructor(emit: WaitEventHandler) {
    this._emit = emit;
  }

  get status(): SessionStatus {
    return this._status;
  }

  get progress(): number | null {
    return this._progress;
  }

  get isTerminal(): boolean {
    return TERMINAL.has(this._status);
  }

  /** Transition to `to`; returns false (and emits nothing) if disallowed. */
  transition(to: SessionStatus): boolean {
    if (this._status === to) return true;
    const from = this._status;
    const allowed = ALLOWED[from];
    if (!allowed || !allowed.has(to)) return false;
    this._status = to;
    this._emit({ type: "phase", data: { from, to } });
    return true;
  }

  setProgress(value?: number): void {
    if (value === undefined || Number.isNaN(value)) {
      this._progress = null;
    } else {
      this._progress = Math.max(0, Math.min(1, value));
    }
    this._emit({ type: "progress", data: this._progress });
  }
}
