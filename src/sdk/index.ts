/**
 * Public entry for the "Make Waiting for AI Fun" SDK.
 *
 * Usage (host app):
 *   import { makeItFun } from "./sdk";
 *   const ctrl = makeItFun({ gameId: "runner", onCheckout: (plan) => myStripe.checkout(plan) });
 *   // Wherever your model call is:
 *   ...
 *   ctrl.progress(0.1, "Reasoning…");
 *   ctrl.progress(0.6, "Drafting…");
 *   ctrl.done();
 */
export { createWaitingWidget as makeItFun, GAMES, GAME_IDS } from "./widget";
import { createWaitingWidget } from "./widget";
export type * from "./types";
export { PLANS, createCheckoutFlow } from "./paywall";
export { leaderboard, bestScore, totalWaitedSeconds, resetAll } from "./persistence";

/**
 * Drop-in auto-init for websites that just add a `data-waiting-widget` element
 * and a tiny script — no build step (see /public/embed.js for the bundled
 * version).
 */
export function autoInit(): void {
  const root = document.querySelector("[data-waiting-widget]");
  if (root && !root.hasAttribute("data-waiting-active")) {
    createWaitingWidget({ target: root as HTMLElement, onProgress: () => undefined });
    root.setAttribute("data-waiting-active", "true");
  }
}

if (typeof window !== "undefined") {
  (window as unknown as { makeWaitingFun?: typeof autoInit }).makeWaitingFun = autoInit;
}
