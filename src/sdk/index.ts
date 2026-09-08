import { createQuickSpin } from "./widget";
export { createQuickSpin } from "./widget";
export { SessionStateMachine } from "./state-machine";
export {
  bestScore,
  bestLabel,
  completedSessions,
  currentDayStreak,
  leaderboard,
  perceivedWaitStats,
  recordSession,
  resetAll,
  totalSessions,
  totalWaitTurnedToPlayMs,
} from "./persistence";
export {
  createRunnerSurface,
  runnerCollides,
  runnerGame,
  runnerJump,
  runnerResult,
  runnerStep,
} from "./runner";
export { createOrbitSurface, orbitGame, orbitResult, orbitStep, orbitTap } from "./orbit";
export { PLANS } from "./paywall";
export type {
  CheckoutResult,
  CreateQuickSpinOptions,
  EndReason,
  GameDefinition,
  GameHost,
  GameId,
  GameInstance,
  GameResult,
  PlanOption,
  QuickSpinController,
  SessionStatus,
  ThemeConfig,
  WaitEvent,
  WaitEventHandler,
  WaitMetrics,
  WaitSession,
} from "./types";
export { GAME_NAME_IDS } from "./types";

function domReady(cb: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cb, { once: true });
  } else {
    cb();
  }
}

/** Mount a QuickSpin instance on every `[data-quickspin]` element. */
export function autoInit(): () => void {
  const controllers: Array<{ destroy(): void }> = [];
  domReady(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-quickspin]"));
    for (const el of targets) {
      try {
        const controller = createQuickSpin({ target: el });
        controllers.push(controller);
      } catch {
        /* invalid markup, skip that node */
      }
    }
  });
  return () => {
    for (const c of controllers) c.destroy();
    controllers.length = 0;
  };
}

declare global {
  interface Window {
    QuickSpin?: {
      createQuickSpin: typeof createQuickSpin;
      autoInit: typeof autoInit;
    };
  }
}

if (typeof window !== "undefined") {
  (window as Window & { QuickSpin?: unknown }).QuickSpin = {
    createQuickSpin,
    autoInit,
  };
}
