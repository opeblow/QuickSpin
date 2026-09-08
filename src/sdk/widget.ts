import type {
  CreateQuickSpinOptions,
  EndReason,
  GameDefinition,
  GameHost,
  GameInstance,
  GameResult,
  QuickSpinController,
  ThemeConfig,
  WaitEvent,
  WaitSession,
} from "./types";
import { SessionStateMachine } from "./state-machine";
import { WIDGET_CSS } from "./styles";
import { runnerGame } from "./runner";
import { orbitGame } from "./orbit";
import { bestLabel, recordSession, totalSessions, totalWaitTurnedToPlayMs } from "./persistence";

const GAMES: Record<string, GameDefinition> = {
  runner: runnerGame,
  orbit: orbitGame,
};

const DARK_THEME: Required<ThemeConfig> = {
  mode: "dark",
  primary: "#8b7cff",
  surface: "#10111a",
  elevated: "#181a27",
  game: "#202334",
  text: "#f8f9fc",
  muted: "#a9b0c0",
  border: "rgba(255,255,255,0.1)",
  success: "#16a36a",
  radius: "16px",
  font: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
};

const LIGHT_THEME: Required<ThemeConfig> = {
  mode: "light",
  primary: "#6658e8",
  surface: "#ffffff",
  elevated: "#f3f4f8",
  game: "#eef0f6",
  text: "#17181d",
  muted: "#68707f",
  border: "rgba(16,17,26,0.1)",
  success: "#16a36a",
  radius: "16px",
  font: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
};

function resolveTarget(target?: string | HTMLElement): HTMLElement {
  if (target instanceof HTMLElement) return target;
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (el instanceof HTMLElement) return el;
  }
  throw new Error("QuickSpin: no target element found. Pass a selector or element.");
}

function formatWait(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${total}s`;
}

export function createQuickSpin(opts: CreateQuickSpinOptions = {}): QuickSpinController {
  const target = resolveTarget(opts.target);
  let gameId = GAMES[opts.game ?? ""] ? opts.game! : "runner";

  const hostEl = document.createElement("div");
  const shadow = hostEl.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = WIDGET_CSS;
  shadow.appendChild(styleEl);

  const root = document.createElement("div");
  root.className = "quickspin-root";

  // Header
  const header = document.createElement("div");
  header.className = "quickspin-header";
  const brand = document.createElement("div");
  brand.className = "quickspin-brand";
  const dot = document.createElement("span");
  dot.className = "quickspin-dot";
  brand.appendChild(dot);
  brand.appendChild(document.createTextNode("QuickSpin"));
  const statusEl = document.createElement("div");
  statusEl.className = "quickspin-status";
  statusEl.setAttribute("role", "status");
  statusEl.setAttribute("aria-live", "polite");
  statusEl.textContent = "Waiting for the model…";
  const elapsedEl = document.createElement("div");
  elapsedEl.className = "quickspin-elapsed";
  elapsedEl.textContent = "0s";
  const tools = document.createElement("div");
  tools.className = "quickspin-tools";
  const minimizeBtn = document.createElement("button");
  minimizeBtn.className = "quickspin-btn";
  minimizeBtn.type = "button";
  minimizeBtn.textContent = "—";
  minimizeBtn.title = "Hide the widget (game pauses)";
  tools.appendChild(minimizeBtn);
  header.appendChild(brand);
  header.appendChild(statusEl);
  header.appendChild(elapsedEl);
  header.appendChild(tools);

  // Game switcher
  const gamesRow = document.createElement("div");
  gamesRow.className = "quickspin-games";
  const gameBtns: HTMLButtonElement[] = [];
  for (const id of Object.keys(GAMES)) {
    const b = document.createElement("button");
    b.className = "quickspin-gamebtn";
    b.type = "button";
    b.textContent = GAMES[id].name;
    b.setAttribute("aria-pressed", gameId === id ? "true" : "false");
    b.addEventListener("click", () => setGame(id));
    gameBtns.push(b);
    gamesRow.appendChild(b);
  }

  // Stage: canvas + result/wait overlay
  const stage = document.createElement("div");
  stage.className = "quickspin-stage";
  const canvas = document.createElement("canvas");
  canvas.className = "quickspin-canvas";
  canvas.width = 480;
  canvas.height = 220;
  const overlay = document.createElement("div");
  overlay.className = "quickspin-overlay";
  overlay.hidden = true;
  stage.appendChild(canvas);
  stage.appendChild(overlay);

  // Footer
  const footer = document.createElement("div");
  footer.className = "quickspin-footer";
  const controlsEl = document.createElement("span");
  controlsEl.textContent = GAMES[gameId].controls;
  const bestEl = document.createElement("span");
  bestEl.textContent = "";
  footer.appendChild(controlsEl);
  footer.appendChild(bestEl);

  // Progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "quickspin-progress";
  const progressFill = document.createElement("div");
  progressFill.className = "quickspin-progress-fill";
  progressBar.appendChild(progressFill);

  root.appendChild(header);
  root.appendChild(gamesRow);
  root.appendChild(stage);
  root.appendChild(progressBar);
  root.appendChild(footer);
  shadow.appendChild(root);
  target.appendChild(hostEl);
  target.setAttribute("data-quickspin-active", "true");

  // ---- theme ----
  let theme: ThemeConfig = opts.theme ?? DARK_THEME;

  function applyTheme(t: ThemeConfig): void {
    theme = t;
    const base = (t.mode === "light" ? LIGHT_THEME : DARK_THEME) as Required<ThemeConfig>;
    const m = { ...base, ...t } as Required<ThemeConfig>;
    hostEl.style.setProperty("--qs-primary", m.primary);
    hostEl.style.setProperty("--qs-surface", m.surface);
    hostEl.style.setProperty("--qs-elevated", m.elevated);
    hostEl.style.setProperty("--qs-game", m.game);
    hostEl.style.setProperty("--qs-text", m.text);
    hostEl.style.setProperty("--qs-muted", m.muted);
    hostEl.style.setProperty("--qs-border", m.border);
    hostEl.style.setProperty("--qs-success", m.success);
    hostEl.style.setProperty("--qs-radius", m.radius);
    hostEl.style.setProperty("--qs-font", m.font);
  }
  applyTheme(theme);

  // ---- state ----
  let currentGame: GameInstance | null = null;
  let sessionActive = false;
  let startedAt = 0;
  let engagedMs = 0;
  let lastTs = 0;
  let raf = 0;
  let visible = true;
  let destroyed = false;
  const machine = new SessionStateMachine(emit);

  let externalHandler: ((e: WaitEvent) => void) | null = null;

  function emit(e: WaitEvent): void {
    if (opts.onEvent) opts.onEvent(e);
    if (externalHandler) externalHandler(e);
  }

  // ---- single RAF owner: visibility-guarded, drives the active game ----
  function loop(ts: number): void {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;

    if (sessionActive) {
      elapsedEl.textContent = formatWait(ts - startedAt);
      if (machine.progress == null) progressFill.classList.add("indeterminate");
    }

    if (sessionActive && currentGame && visible && !document.hidden) {
      currentGame.tick(ts, dt);
      engagedMs += dt * 1000;
    } else if (currentGame) {
      currentGame.pause();
    }
  }

  function setThemeState(id: string): void {
    for (const b of gameBtns) {
      b.setAttribute("aria-pressed", GAMES[id].name === b.textContent ? "true" : "false");
    }
    controlsEl.textContent = GAMES[id].controls;
  }

  function setGame(id: string): void {
    if (!GAMES[id]) return;
    const hadGame = currentGame != null;
    const switching = id !== gameId;
    gameId = id;
    setThemeState(id);
    const old = currentGame;
    currentGame = null;
    old?.destroy();
    if (sessionActive) {
      canvas.style.pointerEvents = "";
      if (hadGame) {
        overlay.hidden = true;
        startGame();
      } else if (!switching) {
        // no running game (e.g. "Just wait"): leave the choose-screen alone
      }
    }
    updateBest();
  }

  function gameHost(): GameHost {
    return {
      canvas,
      root,
      get progress() {
        return machine.progress;
      },
      finish(reason: EndReason): GameResult {
        return onGameFinish(reason);
      },
      elapsedMs() {
        return sessionActive ? performance.now() - startedAt : 0;
      },
    };
  }

  function onGameFinish(reason: EndReason): GameResult {
    const game = currentGame;
    if (!game) return { score: 0, label: "—", notes: [], reason };
    const result = game.finish(reason);
    if (reason === "player-failed") showCrashOverlay(result);
    return result;
  }

  function startGame(): void {
    const old = currentGame;
    currentGame = null;
    old?.destroy();
    const g = GAMES[gameId].create(gameHost());
    currentGame = g;
    g.start();
    emit({ type: "game-start", data: { game: gameId } });
  }

  function focusFirstButton(): void {
    const b = overlay.querySelector<HTMLButtonElement>("button");
    b?.focus();
  }

  function begin(): void {
    startGame();
    overlay.hidden = true;
    canvas.style.pointerEvents = "";
    machine.transition("playing");
  }

  function showChooseScreen(status?: string): void {
    statusEl.textContent = status ?? "Waiting for the model…";
    overlay.hidden = false;
    overlay.innerHTML = "";
    canvas.style.pointerEvents = "none";

    const label = document.createElement("div");
    label.className = "quickspin-waiting-label";
    label.textContent = "AI is working somewhere else…";

    const actions = document.createElement("div");
    actions.className = "quickspin-actions";
    const play = document.createElement("button");
    play.className = "quickspin-btn-primary";
    play.type = "button";
    play.textContent = "Play while you wait";
    play.addEventListener("click", begin);
    const waitBtn = document.createElement("button");
    waitBtn.className = "quickspin-btn-ghost";
    waitBtn.type = "button";
    waitBtn.textContent = "Just wait";
    waitBtn.addEventListener("click", () => {
      overlay.hidden = true;
      machine.transition("playing");
    });
    actions.appendChild(play);
    actions.appendChild(waitBtn);

    overlay.appendChild(label);
    overlay.appendChild(actions);
  }

  function completeSession(): void {
    if (!sessionActive) return;
    sessionActive = false;
    let result: GameResult | null = null;
    if (currentGame) result = currentGame.finish("ai-complete");
    machine.transition("response-ready");
    machine.transition("completed");
    const actualWaitMs = performance.now() - startedAt;
    const rec = recordSession({
      gameId,
      score: result?.score ?? null,
      actualWaitMs,
      engagedPlayMs: engagedMs,
      feltWaitMs: null,
      completed: true,
    });
    emit({
      type: "session-complete",
      data: {
        game: gameId,
        score: result?.score ?? null,
        actualWaitMs,
        engagedMs,
        dayStreak: rec.dayStreak,
        sessionStreak: rec.sessionStreak,
      },
    });
    showResponseOverlay(result, actualWaitMs, rec.isHighScore, rec.dayStreak, rec.sessionStreak);
    destroyGame();
  }

  function cancelSession(): void {
    if (!sessionActive) return;
    sessionActive = false;
    machine.transition("cancelled");
    recordSession({
      gameId,
      score: null,
      actualWaitMs: performance.now() - startedAt,
      engagedPlayMs: engagedMs,
      feltWaitMs: null,
      completed: false,
    });
    emit({ type: "cancel", data: { game: gameId } });
    showCancelledOverlay();
    destroyGame();
  }

  function failSession(error?: unknown): void {
    if (!sessionActive) return;
    sessionActive = false;
    machine.transition("failed");
    recordSession({
      gameId,
      score: null,
      actualWaitMs: performance.now() - startedAt,
      engagedPlayMs: engagedMs,
      feltWaitMs: null,
      completed: false,
    });
    emit({ type: "fail", data: { error } });
    showErrorOverlay(error);
    destroyGame();
  }

  function destroyGame(): void {
    const old = currentGame;
    currentGame = null;
    old?.destroy();
  }

  function showCrashOverlay(result: GameResult): void {
    overlay.hidden = false;
    overlay.innerHTML = "";
    const label = document.createElement("div");
    label.className = "quickspin-label";
    label.textContent = "Crash! The model is still working.";
    const score = document.createElement("div");
    score.className = "quickspin-score-big";
    score.textContent = result.label;
    const actions = document.createElement("div");
    actions.className = "quickspin-actions";
    const replay = document.createElement("button");
    replay.className = "quickspin-btn-primary";
    replay.type = "button";
    replay.textContent = "Play again";
    replay.addEventListener("click", begin);
    const wait = document.createElement("button");
    wait.className = "quickspin-btn-ghost";
    wait.type = "button";
    wait.textContent = "Keep waiting";
    wait.addEventListener("click", () => {
      overlay.hidden = true;
    });
    actions.appendChild(replay);
    actions.appendChild(wait);
    overlay.appendChild(label);
    overlay.appendChild(score);
    overlay.appendChild(actions);
    focusFirstButton();
  }

  function showResponseOverlay(
    result: GameResult | null,
    actualWaitMs: number,
    isHigh: boolean,
    dayStreak: number,
    sessionStreak: number
  ): void {
    overlay.hidden = false;
    overlay.innerHTML = "";
    const title = document.createElement("div");
    title.className = "quickspin-label";
    title.textContent = "Response ready";
    const score = document.createElement("div");
    score.className = "quickspin-score-big";
    score.textContent = result ? result.label : "—";
    const notes = document.createElement("ul");
    notes.className = "quickspin-notes";
    const items: string[] = [];
    if (result?.notes) items.push(...result.notes);
    if (isHigh) items.push("New personal best");
    items.push(`Streaks — days ${dayStreak} · sessions ${sessionStreak}`);
    for (const n of items) {
      const li = document.createElement("li");
      li.textContent = n;
      notes.appendChild(li);
    }
    overlay.appendChild(title);
    overlay.appendChild(score);
    overlay.appendChild(notes);

    const ok = (feltMs: number): void => {
      const reduction = Math.max(0, 1 - feltMs / Math.max(1, actualWaitMs));
      emit({ type: "perceived-wait", data: { felt: feltMs, actual: actualWaitMs, reduction } });
      overlay.innerHTML = "";
      const redTitle = document.createElement("div");
      redTitle.className = "quickspin-reduction";
      redTitle.textContent = `QuickSpin cut the perceived wait by ${Math.round(reduction * 100)}% this session.`;
      const done = document.createElement("button");
      done.className = "quickspin-btn-primary";
      done.type = "button";
      done.textContent = "View response";
      done.addEventListener("click", () => {
        overlay.hidden = true;
      });
      overlay.appendChild(redTitle);
      overlay.appendChild(done);
      done.focus();
    };

    const q = document.createElement("div");
    q.className = "quickspin-label";
    q.textContent = `That took ${formatWait(actualWaitMs)}. How long did it feel?`;
    const feltWrap = document.createElement("div");
    feltWrap.className = "quickspin-felt";
    const opts2: Array<[string, number]> = [
      ["Under 10s", 8000],
      ["About 15s", 15000],
      ["Over 20s", 22000],
    ];
    for (const [txt, ms] of opts2) {
      const b = document.createElement("button");
      b.className = "quickspin-felt-btn";
      b.type = "button";
      b.textContent = txt;
      b.addEventListener("click", () => ok(ms));
      feltWrap.appendChild(b);
    }
    overlay.appendChild(q);
    overlay.appendChild(feltWrap);

    const view = document.createElement("button");
    view.className = "quickspin-btn-ghost";
    view.type = "button";
    view.textContent = "View response";
    view.addEventListener("click", () => {
      overlay.hidden = true;
    });
    const actions = document.createElement("div");
    actions.className = "quickspin-actions";
    actions.appendChild(view);
    overlay.appendChild(actions);
    focusFirstButton();
  }

  function showCancelledOverlay(): void {
    overlay.hidden = false;
    overlay.innerHTML = "";
    const label = document.createElement("div");
    label.className = "quickspin-label";
    label.textContent = "Wait cancelled.";
    overlay.appendChild(label);
  }

  function showErrorOverlay(error?: unknown): void {
    overlay.hidden = false;
    overlay.innerHTML = "";
    const label = document.createElement("div");
    label.className = "quickspin-label";
    label.textContent = "Something went wrong.";
    if (error instanceof Error) label.textContent += ` ${error.message}`;
    overlay.appendChild(label);
  }

  function updateBest(): void {
    bestEl.textContent = bestLabel(gameId) ? `Best: ${bestLabel(gameId)}` : "";
  }

  function updateFooterStats(): void {
    bestEl.textContent =
      `${totalSessions()} sessions · ${formatWait(totalWaitTurnedToPlayMs())} of AI wait turned into play · ` +
      (bestLabel(gameId) ? `Best: ${bestLabel(gameId)}` : "No best yet");
  }

  // ---- visibility ----
  const onVisibility = (): void => {
    if (document.hidden || !visible) currentGame?.pause();
    else {
      currentGame?.resume();
      lastTs = 0;
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  function hide(): void {
    visible = false;
    hostEl.style.display = "none";
    currentGame?.pause();
  }
  function show(): void {
    visible = true;
    hostEl.style.display = "";
    currentGame?.resume();
    lastTs = 0;
  }

  minimizeBtn.addEventListener("click", () => {
    if (visible) hide();
    else show();
  });

  // If the host page hidden at load, the RAF still runs but tick is guarded.
  raf = requestAnimationFrame(loop);
  updateFooterStats();

  function startSession(options?: { gameId?: string; status?: string }): WaitSession {
    sessionActive = true;
    startedAt = performance.now();
    engagedMs = 0;
    lastTs = 0;
    progressFill.style.width = "0%";
    progressFill.classList.remove("indeterminate");
    elapsedEl.textContent = "0s";
    const o = options ?? {};
    const gid = o.gameId ?? gameId;
    if (GAMES[gid]) setGameNoStart(gid);
    showChooseScreen(o.status);
    emit({ type: "session-start", data: { game: gameId } });
    return session;
  }

  function setGameNoStart(id: string): void {
    gameId = id;
    setThemeState(id);
  }

  const session: WaitSession = {
    setPhase(phase: string) {
      if (!sessionActive) return;
      statusEl.textContent = phase;
      emit({ type: "phase", data: { from: machine.status } });
    },
    setProgress(value?: number) {
      if (!sessionActive) return;
      machine.setProgress(value);
      if (value === undefined || Number.isNaN(value)) {
        progressFill.classList.add("indeterminate");
      } else {
        progressFill.classList.remove("indeterminate");
        progressFill.style.width = `${(Math.min(1, Math.max(0, value)) * 100).toFixed(1)}%`;
      }
    },
    complete() {
      completeSession();
    },
    cancel() {
      cancelSession();
    },
    fail(error?: unknown) {
      failSession(error);
    },
  };

  const controller: QuickSpinController = {
    start(options) {
      if (sessionActive) cancelSession();
      return startSession(options);
    },
    async track<T>(
      request: Promise<T>,
      options?: { gameId?: string; status?: string }
    ): Promise<T> {
      const s = startSession(options);
      try {
        const val = await request;
        s.complete();
        return val;
      } catch (err) {
        s.fail(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    setTheme(t) {
      applyTheme(t);
    },
    show() {
      show();
    },
    hide() {
      hide();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      destroyGame();
      hostEl.remove();
      if (target.hasAttribute("data-quickspin-active"))
        target.removeAttribute("data-quickspin-active");
    },
    on(handler) {
      externalHandler = handler;
      return () => {
        if (externalHandler === handler) externalHandler = null;
      };
    },
    get status() {
      return machine.status;
    },
  };

  return controller;
}
