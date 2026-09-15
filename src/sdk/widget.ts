import type {
  CreateQuickSpinOptions,
  EndReason,
  ExecutionSignal,
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
import {
  bestLabel,
  recordSession,
  totalSessions,
  totalWaitTurnedToPlayMs,
  updateSessionPerception,
} from "./persistence";

const GAMES: Record<string, GameDefinition> = {
  runner: runnerGame,
  orbit: orbitGame,
};

const SIGNAL_KINDS = new Set<ExecutionSignal["kind"]>(["retrieval", "tool", "artifact", "warning"]);

function normalizeExecutionSignal(signal: ExecutionSignal): ExecutionSignal | null {
  const kind = signal?.kind;
  const label = typeof signal?.label === "string" ? signal.label.trim() : "";
  const evidenceRef = typeof signal?.evidenceRef === "string" ? signal.evidenceRef.trim() : "";
  if (!SIGNAL_KINDS.has(kind) || !label || !evidenceRef) return null;
  return {
    kind,
    label: label.slice(0, 64),
    evidenceRef: evidenceRef.slice(0, 160),
  };
}

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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function createQuickSpin(opts: CreateQuickSpinOptions = {}): QuickSpinController {
  const target = resolveTarget(opts.target);
  const revealDelayMs = Math.max(0, opts.delayMs ?? 650);
  let gameId = GAMES[opts.game ?? ""] ? opts.game! : "runner";

  const hostEl = document.createElement("div");
  hostEl.style.display = "none";
  const shadow = hostEl.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = WIDGET_CSS;
  shadow.appendChild(styleEl);

  const root = document.createElement("div");
  root.className = "quickspin-root";

  const collapsedBar = document.createElement("div");
  collapsedBar.className = "quickspin-collapsed";
  const collapsedText = document.createElement("span");
  collapsedText.className = "quickspin-collapsed-text";
  collapsedText.textContent = "QuickSpin · AI working";
  const reopenBtn = document.createElement("button");
  reopenBtn.className = "quickspin-btn-primary quickspin-reopen";
  reopenBtn.type = "button";
  reopenBtn.textContent = "Resume play";
  collapsedBar.appendChild(collapsedText);
  collapsedBar.appendChild(reopenBtn);

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
  minimizeBtn.title = "Collapse QuickSpin (game pauses)";
  minimizeBtn.setAttribute("aria-label", "Collapse QuickSpin");
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

  root.appendChild(collapsedBar);
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
  let manuallyHidden = false;
  let collapsed = false;
  let uiShown = false;
  let destroyed = false;
  let revealTimer: number | null = null;
  let latestPhase: string | null = null;
  let phaseIndex = -1;
  let phaseIntensity = 0;
  const pendingSignals: ExecutionSignal[] = [];
  let latestStatus = "Waiting for the model…";
  const machine = new SessionStateMachine(emit);

  let externalHandler: ((e: WaitEvent) => void) | null = null;

  function emit(e: WaitEvent): void {
    if (opts.onEvent) opts.onEvent(e);
    if (externalHandler) externalHandler(e);
  }

  function clearRevealTimer(): void {
    if (revealTimer != null) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    }
  }

  function syncVisibility(): void {
    const shouldShow = uiShown && !manuallyHidden;
    hostEl.style.display = shouldShow ? "" : "none";
    root.classList.toggle("is-collapsed", collapsed);
  }

  function updateCollapsedCopy(): void {
    if (!sessionActive) {
      collapsedText.textContent = "QuickSpin · response ready";
      return;
    }
    const elapsed = formatWait(performance.now() - startedAt);
    const phase = latestPhase ?? latestStatus;
    collapsedText.textContent = `QuickSpin · ${phase} · ${elapsed}`;
  }

  // ---- single RAF owner: visibility-guarded, drives the active game ----
  function loop(ts: number): void {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;

    if (sessionActive) {
      elapsedEl.textContent = formatWait(performance.now() - startedAt);
      updateCollapsedCopy();
      if (machine.progress == null) progressFill.classList.add("indeterminate");
    }

    const canTick =
      sessionActive && currentGame && uiShown && !collapsed && !manuallyHidden && !document.hidden;

    if (canTick && currentGame) {
      currentGame.resume();
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
    if (sessionActive && uiShown) {
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
      get intensity() {
        return machine.progress == null ? phaseIntensity : clamp01(machine.progress);
      },
      get phase() {
        return latestPhase;
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
    if (reason === "player-failed" && sessionActive) showCrashOverlay(result);
    return result;
  }

  function startGame(): void {
    const old = currentGame;
    currentGame = null;
    old?.destroy();
    const g = GAMES[gameId].create(gameHost());
    currentGame = g;
    g.start();
    if (g.signal && pendingSignals.length > 0) {
      const queued = pendingSignals.splice(0, pendingSignals.length);
      for (const signal of queued) g.signal(signal);
    }
    emit({
      type: "game-start",
      data: { game: gameId, phase: latestPhase, intensity: gameHost().intensity },
    });
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
    latestStatus = status ?? latestStatus;
    statusEl.textContent = latestPhase ?? latestStatus;
    overlay.hidden = false;
    overlay.innerHTML = "";
    canvas.style.pointerEvents = "none";

    const label = document.createElement("div");
    label.className = "quickspin-waiting-label";
    label.textContent = latestPhase
      ? `AI is working · ${latestPhase}`
      : "AI is working — play without leaving the response behind.";

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
    });
    actions.appendChild(play);
    actions.appendChild(waitBtn);

    overlay.appendChild(label);
    overlay.appendChild(actions);
  }

  function revealSessionUI(): void {
    if (!sessionActive || destroyed) return;
    revealTimer = null;
    uiShown = true;
    collapsed = false;
    syncVisibility();
    showChooseScreen(latestStatus);
  }

  function finishHandoff(): void {
    overlay.hidden = true;
    collapsed = false;
    uiShown = false;
    syncVisibility();
  }

  function completeSession(): void {
    if (!sessionActive) return;
    clearRevealTimer();
    sessionActive = false;
    let result: GameResult | null = null;
    if (currentGame) result = currentGame.finish("ai-complete");
    machine.transition("response-ready");
    machine.transition("completed");
    const actualWaitMs = performance.now() - startedAt;
    const rec = recordSession({
      gameId: currentGame ? gameId : null,
      score: result?.score ?? null,
      actualWaitMs,
      engagedPlayMs: engagedMs,
      feltWaitMs: null,
      completed: true,
      outcome: "completed",
    });
    const engagedRatio = actualWaitMs > 0 ? clamp01(engagedMs / actualWaitMs) : 0;
    emit({
      type: "session-complete",
      data: {
        id: rec.id,
        game: currentGame ? gameId : null,
        score: result?.score ?? null,
        actualWaitMs,
        engagedMs,
        engagedRatio,
        dayStreak: rec.dayStreak,
        sessionStreak: rec.sessionStreak,
      },
    });
    destroyGame();
    updateFooterStats();

    if (uiShown) {
      updateCollapsedCopy();
      showResponseOverlay(
        result,
        actualWaitMs,
        engagedMs,
        rec.id,
        rec.isHighScore,
        rec.dayStreak,
        rec.sessionStreak
      );
    } else {
      // Fast responses finish cleanly without flashing the game UI.
      uiShown = false;
      syncVisibility();
    }
  }

  function cancelSession(): void {
    if (!sessionActive) return;
    clearRevealTimer();
    sessionActive = false;
    machine.transition("cancelled");
    const rec = recordSession({
      gameId: currentGame ? gameId : null,
      score: null,
      actualWaitMs: performance.now() - startedAt,
      engagedPlayMs: engagedMs,
      feltWaitMs: null,
      completed: false,
      outcome: "cancelled",
    });
    emit({
      type: "cancel",
      data: { id: rec.id, outcome: "cancelled", game: currentGame ? gameId : null },
    });
    destroyGame();
    if (uiShown) showCancelledOverlay();
    else syncVisibility();
  }

  function failSession(error?: unknown): void {
    if (!sessionActive) return;
    clearRevealTimer();
    sessionActive = false;
    machine.transition("failed");
    const failure = error instanceof Error ? error : new Error(String(error ?? "UNKNOWN_FAILURE"));
    const rec = recordSession({
      gameId: currentGame ? gameId : null,
      score: null,
      actualWaitMs: performance.now() - startedAt,
      engagedPlayMs: engagedMs,
      feltWaitMs: null,
      completed: false,
      outcome: "failed",
      failureCode: "HOST_REQUEST_FAILED",
      failureMessage: failure.message.slice(0, 240),
    });
    emit({
      type: "fail",
      data: {
        id: rec.id,
        outcome: "failed",
        code: "HOST_REQUEST_FAILED",
        error: { name: failure.name, message: failure.message },
      },
    });
    destroyGame();
    if (uiShown) showErrorOverlay(failure, rec.id);
    else syncVisibility();
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

  function showWaitReceipt(
    recordId: string,
    actualWaitMs: number,
    engagedPlayMs: number,
    feltWaitMs: number | null
  ): void {
    overlay.hidden = false;
    overlay.innerHTML = "";
    const ratio = feltWaitMs == null || actualWaitMs <= 0 ? null : feltWaitMs / actualWaitMs;
    const deltaMs = feltWaitMs == null ? null : feltWaitMs - actualWaitMs;
    const engagement = actualWaitMs > 0 ? clamp01(engagedPlayMs / actualWaitMs) : 0;

    const title = document.createElement("div");
    title.className = "quickspin-receipt-title";
    title.textContent = "WAIT RECEIPT";
    const grid = document.createElement("div");
    grid.className = "quickspin-receipt";

    const fields: Array<[string, string]> = [
      ["Actual", formatWait(actualWaitMs)],
      ["Played", formatWait(engagedPlayMs)],
      ["Engaged", `${Math.round(engagement * 100)}%`],
      ["Felt", feltWaitMs == null ? "Skipped" : formatWait(feltWaitMs)],
    ];
    for (const [label, value] of fields) {
      const cell = document.createElement("div");
      cell.className = "quickspin-receipt-cell";
      const l = document.createElement("span");
      l.textContent = label;
      const v = document.createElement("strong");
      v.textContent = value;
      cell.appendChild(l);
      cell.appendChild(v);
      grid.appendChild(cell);
    }

    overlay.appendChild(title);
    overlay.appendChild(grid);

    if (ratio != null && deltaMs != null) {
      const summary = document.createElement("div");
      summary.className = ratio <= 1 ? "quickspin-reduction" : "quickspin-extension";
      const pct = Math.round(Math.abs(1 - ratio) * 100);
      summary.textContent =
        ratio < 0.995
          ? `This wait felt ${pct}% shorter.`
          : ratio > 1.005
            ? `This wait felt ${pct}% longer.`
            : "This wait felt about as long as it actually took.";
      overlay.appendChild(summary);
    }

    emit({
      type: "receipt",
      data: {
        id: recordId,
        actualWaitMs,
        engagedPlayMs,
        engagement,
        feltWaitMs,
        ratio,
        deltaMs,
      },
    });

    const done = document.createElement("button");
    done.className = "quickspin-btn-primary";
    done.type = "button";
    done.textContent = "View response";
    done.addEventListener("click", finishHandoff);
    overlay.appendChild(done);
    done.focus();
  }

  function showResponseOverlay(
    result: GameResult | null,
    actualWaitMs: number,
    engagedPlayMs: number,
    recordId: string,
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

    const answerPerception = (feltMs: number): void => {
      const stored = updateSessionPerception(recordId, feltMs);
      const ratio = feltMs / Math.max(1, actualWaitMs);
      const deltaMs = feltMs - actualWaitMs;
      const change = 1 - ratio;
      emit({
        type: "perceived-wait",
        data: {
          id: recordId,
          felt: feltMs,
          actual: actualWaitMs,
          ratio,
          deltaMs,
          change,
          reduction: change,
          persisted: Boolean(stored),
        },
      });
      updateFooterStats();
      showWaitReceipt(recordId, actualWaitMs, engagedPlayMs, feltMs);
    };

    const q = document.createElement("div");
    q.className = "quickspin-label";
    q.textContent = `That took ${formatWait(actualWaitMs)}. How long did it feel?`;
    const feltWrap = document.createElement("div");
    feltWrap.className = "quickspin-felt";
    const fast = Math.max(1000, actualWaitMs * 0.6);
    const same = actualWaitMs;
    const slow = Math.max(actualWaitMs + 1000, actualWaitMs * 1.4);
    const opts2: Array<[string, number]> = [
      [`Faster · ~${formatWait(fast)}`, fast],
      [`About the same · ~${formatWait(same)}`, same],
      [`Longer · ~${formatWait(slow)}`, slow],
    ];
    for (const [txt, ms] of opts2) {
      const b = document.createElement("button");
      b.className = "quickspin-felt-btn";
      b.type = "button";
      b.textContent = txt;
      b.addEventListener("click", () => answerPerception(ms));
      feltWrap.appendChild(b);
    }
    overlay.appendChild(q);
    overlay.appendChild(feltWrap);

    const skip = document.createElement("button");
    skip.className = "quickspin-btn-ghost";
    skip.type = "button";
    skip.textContent = "Skip question · view receipt";
    skip.addEventListener("click", () =>
      showWaitReceipt(recordId, actualWaitMs, engagedPlayMs, null)
    );
    const actions = document.createElement("div");
    actions.className = "quickspin-actions";
    actions.appendChild(skip);
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

  function showErrorOverlay(error: Error, recordId: string): void {
    overlay.hidden = false;
    overlay.innerHTML = "";
    const label = document.createElement("div");
    label.className = "quickspin-label";
    label.textContent = "Request failed — no response fabricated.";
    const detail = document.createElement("div");
    detail.className = "quickspin-notes";
    detail.textContent = `${error.message} · evidence ${recordId.slice(0, 8)}`;
    overlay.appendChild(label);
    overlay.appendChild(detail);
  }

  function updateBest(): void {
    bestEl.textContent = bestLabel(gameId) ? `Best: ${bestLabel(gameId)}` : "";
  }

  function updateFooterStats(): void {
    bestEl.textContent =
      `${totalSessions()} sessions · ${formatWait(totalWaitTurnedToPlayMs())} played during AI wait · ` +
      (bestLabel(gameId) ? `Best: ${bestLabel(gameId)}` : "No best yet");
  }

  // ---- visibility ----
  const onVisibility = (): void => {
    if (document.hidden || manuallyHidden || collapsed) currentGame?.pause();
    else {
      currentGame?.resume();
      lastTs = 0;
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  function hide(): void {
    manuallyHidden = true;
    syncVisibility();
    currentGame?.pause();
  }

  function show(): void {
    manuallyHidden = false;
    syncVisibility();
    if (!collapsed) currentGame?.resume();
    lastTs = 0;
  }

  minimizeBtn.addEventListener("click", () => {
    collapsed = true;
    root.classList.add("is-collapsed");
    currentGame?.pause();
    updateCollapsedCopy();
  });

  reopenBtn.addEventListener("click", () => {
    collapsed = false;
    root.classList.remove("is-collapsed");
    currentGame?.resume();
    lastTs = 0;
  });

  // If the host page is hidden at load, the RAF still runs but tick is guarded.
  raf = requestAnimationFrame(loop);
  updateFooterStats();

  function prepareMachineForStart(): void {
    if (machine.status === "destroyed") throw new Error("QuickSpin: controller is destroyed.");
    if (
      machine.status === "completed" ||
      machine.status === "cancelled" ||
      machine.status === "failed"
    ) {
      machine.transition("idle");
    }
    if (machine.status !== "idle")
      throw new Error(`QuickSpin: cannot start from ${machine.status}.`);
    if (!machine.transition("waiting"))
      throw new Error("QuickSpin: failed to enter waiting state.");
  }

  function startSession(options?: { gameId?: string; status?: string }): WaitSession {
    if (destroyed) throw new Error("QuickSpin: controller is destroyed.");
    prepareMachineForStart();
    sessionActive = true;
    startedAt = performance.now();
    engagedMs = 0;
    lastTs = 0;
    latestPhase = null;
    phaseIndex = -1;
    phaseIntensity = 0;
    pendingSignals.length = 0;
    collapsed = false;
    uiShown = false;
    progressFill.style.width = "0%";
    progressFill.classList.remove("indeterminate");
    elapsedEl.textContent = "0s";
    const o = options ?? {};
    latestStatus = o.status ?? "Waiting for the model…";
    statusEl.textContent = latestStatus;
    const gid = o.gameId ?? gameId;
    if (GAMES[gid]) setGameNoStart(gid);
    syncVisibility();
    emit({ type: "session-start", data: { game: gameId, delayMs: revealDelayMs } });

    if (revealDelayMs === 0) revealSessionUI();
    else revealTimer = window.setTimeout(revealSessionUI, revealDelayMs);
    return session;
  }

  function setGameNoStart(id: string): void {
    gameId = id;
    setThemeState(id);
  }

  const session: WaitSession = {
    setPhase(phase: string) {
      if (!sessionActive) return;
      const normalized = phase.trim();
      if (!normalized) return;
      if (normalized !== latestPhase) {
        latestPhase = normalized;
        phaseIndex += 1;
        phaseIntensity = clamp01(0.18 + Math.max(0, phaseIndex) * 0.22);
      }
      statusEl.textContent = normalized;
      if (uiShown && !currentGame && !overlay.hidden) {
        const waitingLabel = overlay.querySelector<HTMLElement>(".quickspin-waiting-label");
        if (waitingLabel) waitingLabel.textContent = `AI is working · ${normalized}`;
      }
      updateCollapsedCopy();
      emit({
        type: "phase",
        data: {
          phase: normalized,
          index: phaseIndex,
          intensity: machine.progress == null ? phaseIntensity : machine.progress,
          status: machine.status,
        },
      });
    },
    setProgress(value?: number) {
      if (!sessionActive) return;
      machine.setProgress(value);
      if (value === undefined || Number.isNaN(value)) {
        progressFill.classList.add("indeterminate");
      } else {
        progressFill.classList.remove("indeterminate");
        progressFill.style.width = `${(clamp01(value) * 100).toFixed(1)}%`;
      }
    },
    signal(signal: ExecutionSignal) {
      if (!sessionActive) return false;
      const normalized = normalizeExecutionSignal(signal);
      if (!normalized) {
        emit({
          type: "signal-rejected",
          data: {
            outcome: "UNKNOWN",
            reason: "INSUFFICIENT_EVIDENCE",
            phase: latestPhase,
            status: machine.status,
          },
        });
        return false;
      }

      if (currentGame?.signal) currentGame.signal(normalized);
      else {
        pendingSignals.push(normalized);
        if (pendingSignals.length > 8) pendingSignals.shift();
      }

      emit({
        type: "signal",
        data: {
          ...normalized,
          phase: latestPhase,
          status: machine.status,
        },
      });
      return true;
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
      if (sessionActive) cancelSession();
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
      clearRevealTimer();
      destroyed = true;
      sessionActive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      destroyGame();
      machine.transition("destroyed");
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
