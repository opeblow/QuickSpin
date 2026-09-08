import type {
  GameDefinition,
  GameHost,
  GameInstance,
  GameResult,
  WaitingController,
  WidgetOptions,
} from "./types";
import { runnerGame } from "./runner";
import { fishGame } from "./fish";
import {
  bestLabel,
  currentStreak,
  recordResult,
  totalSessions,
  totalWaitedSeconds,
} from "./persistence";
import { createCheckoutFlow, PLANS } from "./paywall";

export const GAMES: Record<string, GameDefinition> = {
  [runnerGame.id]: runnerGame,
  [fishGame.id]: fishGame,
};

export const GAME_IDS = Object.keys(GAMES);

export function createWaitingWidget(opts: WidgetOptions = {}): WaitingController {
  const target = resolveTarget(opts.target);
  const theme = opts.theme === "light" ? "light" : "dark";
  const onCheckout = opts.onCheckout;

  let progress = 0;
  let status = "Thinking…";
  let visible = !opts.onProgress; // auto-hide if host drives progress
  let currentGame: GameInstance | null = null;
  let currentGameId: string | null = null;
  let startedMillis = 0;
  let paused = false;
  let destroyed = false;

  const root = document.createElement("div");
  root.className = `wfun-root wfun-${theme}`;

  const header = document.createElement("div");
  header.className = "wfun-header";

  const statusEl = document.createElement("div");
  statusEl.className = "wfun-status";
  statusEl.textContent = status;

  const streakEl = document.createElement("div");
  streakEl.className = "wfun-streak";

  const body = document.createElement("div");
  body.className = "wfun-body";

  const canvas = document.createElement("canvas");
  canvas.className = "wfun-canvas";

  const progressBar = document.createElement("div");
  progressBar.className = "wfun-progress";
  const progressFill = document.createElement("div");
  progressFill.className = "wfun-progress-fill";
  progressBar.appendChild(progressFill);

  const footer = document.createElement("div");
  footer.className = "wfun-footer";

  const statsEl = document.createElement("div");
  statsEl.className = "wfun-stats";

  const upgradeBtn = document.createElement("button");
  upgradeBtn.className = "wfun-upgrade";
  upgradeBtn.type = "button";
  upgradeBtn.textContent = "Upgrade the wait";

  const checkout = createCheckoutFlow(handleCheckout);

  function handleCheckout(plan: string): void {
    if (onCheckout) {
      void onCheckout(plan);
    } else {
      // Default: surface the fact in the UI so the "revenue" story is visible.
      const p = PLANS.find((x) => x.id === plan);
      if (p && p.priceUsd > 0) statusEl.textContent = `✓ Pro active — the wait pays.`;
    }
  }

  function resolveTarget(t?: string | HTMLElement): HTMLElement {
    if (t instanceof HTMLElement) return t;
    if (typeof t === "string") {
      const el = document.querySelector(t);
      if (el instanceof HTMLElement) return el;
    }
    const data = document.querySelector("[data-waiting-widget]");
    if (data instanceof HTMLElement) return data;
    throw new Error(
      "No valid widget target found. Pass a selector/element or add [data-waiting-widget]."
    );
  }

  function updateStreak(): void {
    const streak = currentStreak();
    streakEl.textContent = streak > 0 ? `🔥 ${streak}-day streak` : "Start your streak";
  }

  function updateStats(): void {
    const secs = totalWaitedSeconds();
    const sessions = totalSessions();
    if (sessions === 0 && secs === 0) {
      statsEl.textContent = "No waits logged yet — every AI wait is now a game.";
    } else {
      statsEl.textContent = `${sessions} sessions · ${secs}s of wait turned into play · streak ${currentStreak()}`;
    }
  }

  function gameHost(): GameHost {
    return {
      canvas,
      get progress() {
        return progress;
      },
      get status() {
        return status;
      },
      finish(result: GameResult) {
        finishGame(result);
      },
    };
  }

  function startGame(id?: string): void {
    if (destroyed) return;
    stopCurrent();
    const gameId = (id && GAMES[id] ? id : runnerGame.id) as string;
    const game = GAMES[gameId];
    if (!game) return;
    currentGameId = gameId;
    progress = progress > 0.98 ? 0 : progress;
    currentGame = game.create(gameHost());
    currentGame.start();
    if (!paused) {
      startedMillis = performance.now();
    }
  }

  function finishGame(result: GameResult): void {
    const gameId = currentGameId || runnerGame.id;
    const elapsed = Math.max(0, performance.now() - startedMillis);
    const { isHighScore, streak } = recordResult(gameId, result.score, result.label, elapsed);
    updateStreak();
    updateStats();
    const notes = [
      ...result.notes,
      isHighScore ? "New personal best!" : `Best: ${bestLabel(gameId) || "—"}`,
      `Streak: ${streak}`,
    ];
    showFinishScreen(gameId, result, notes);
    stopCurrent();
  }

  function showFinishScreen(gameId: string, result: GameResult, notes: string[]): void {
    canvas.style.display = "none";
    const screen = document.createElement("div");
    screen.className = "wfun-finish";
    screen.innerHTML = `
      <div class="wfun-big">${result.score.toLocaleString()}</div>
      <div class="wfun-sub">${result.label}</div>
      <ul class="wfun-notes">${notes.map((n) => `<li>${n}</li>`).join("")}</ul>
      <div class="wfun-actions"></div>
    `;
    const actions = screen.querySelector(".wfun-actions") as HTMLElement;
    const replay = document.createElement("button");
    replay.type = "button";
    replay.className = "wfun-replay";
    replay.textContent = "Play again";
    replay.addEventListener("click", () => {
      screen.remove();
      canvas.style.display = "block";
      startGame(gameId);
    });
    const close = document.createElement("button");
    close.type = "button";
    close.className = "wfun-dismiss";
    close.textContent = "Done";
    close.addEventListener("click", () => {
      screen.remove();
      canvas.style.display = "block";
    });
    actions.append(replay, close);
    body.appendChild(screen);
  }

  function stopCurrent(): void {
    if (currentGame) {
      currentGame.destroy();
      currentGame = null;
    }
  }

  function build(): void {
    header.innerHTML = "";
    root.innerHTML = "";
    header.appendChild(statusEl);
    header.appendChild(streakEl);

    const switchWrap = document.createElement("div");
    switchWrap.className = "wfun-switch";
    switchWrap.innerHTML = GAME_IDS.map(
      (id) =>
        `<button type="button" class="wfun-gamebtn" data-gameid="${id}">${GAMES[id as keyof typeof GAMES].name}</button>`
    ).join("");
    switchWrap.querySelectorAll(".wfun-gamebtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-gameid") as string;
        startGame(id);
        if (GAMES[id as keyof typeof GAMES]) {
          statusEl.textContent = status;
        }
      });
    });

    root.appendChild(header);
    root.appendChild(switchWrap);
    root.appendChild(body);
    body.appendChild(canvas);
    root.appendChild(progressBar);
    root.appendChild(footer);
    footer.appendChild(statsEl);
    footer.appendChild(upgradeBtn);

    const fin = document.createElement("div");
    fin.className = "wfun-hint";
    fin.textContent = "You play while the model works. The wait ends with the game.";
    footer.appendChild(fin);

    upgradeBtn.addEventListener("click", () => checkout.open());
    updateStreak();
    updateStats();
    target.appendChild(root);
  }

  function setProgress(p: number, st?: string): void {
    progress = Math.max(0, Math.min(1, p));
    if (st) status = st;
    statusEl.textContent = status;
    progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    if (progress >= 1) {
      done();
    }
  }

  function done(): void {
    if (currentGame) {
      // Let the game finish naturally with progress=1 → ruff.
      const result: GameResult = {
        score: Math.floor(400 + Math.random() * 400),
        label: "Wait complete",
        notes: [],
      };
      finishGame(result);
    } else {
      progressFill.style.width = "100%";
      statusEl.textContent = "AI responded — the wait is over.";
    }
  }

  function loop(): void {
    if (destroyed) return;
    if (paused || !visible) {
      requestAnimationFrame(loop);
      return;
    }
    // Live elapsed for the footer even when a game isn't active.
    requestAnimationFrame(loop);
  }

  build();
  requestAnimationFrame(loop);

  return {
    progress(p, st) {
      if (p < progress) {
        // a new wait began
        status = st || "Thinking…";
        startGame();
      }
      setProgress(p, st);
    },
    done,
    show(v) {
      visible = v;
      root.style.display = v ? "block" : "none";
    },
    startGame,
    destroy() {
      destroyed = true;
      stopCurrent();
      checkout.destroy();
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    },
  };
}
