import "./demo.css";
import { makeItFun, GAMES, resetAll } from "../sdk/index";
import type { WaitingController } from "../sdk/types";

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
}

function buildPage(): HTMLElement {
  const page = el("div", "page");

  page.appendChild(
    el(
      "div",
      "nav",
      `<div class="logo">quick<span>spin</span></div><small>Make Waiting for AI Fun · Commonsmade · Sep 17 2026</small>`
    )
  );

  const hero = el("div", "hero");
  hero.appendChild(
    el("h1", "", `Every second you wait on AI, the winner takes <em>another step ahead.</em>`)
  );
  hero.appendChild(
    el(
      "p",
      "",
      `Waiting on a thinking model is the deadliest UX moment in AI. ` +
        `QuickSpin turns that dead time into a playable arcade — a drop-in widget any AI app can embed. ` +
        `You play while the model works. The wait ends with the game.`
    )
  );
  hero.appendChild(
    el(
      "p",
      "sub",
      `Live demo below. Play while the fake model “thinks,” then watch the streak build.`
    )
  );
  const badges = el("div", "badges");
  badges.innerHTML = `
    <span class="badge hot">AI-native fit</span>
    <span class="badge hot">Repeatability loop</span>
    <span class="badge">Monetizable (Vault)</span>
    <span class="badge">Embeddable SDK</span>
  `;
  hero.appendChild(badges);
  page.appendChild(hero);

  const grid = el("div", "grid");

  const hostPanel = el("div", "panel");
  hostPanel.appendChild(el("div", "hostlabel", "HOST APP — a fake AI client"));
  hostPanel.appendChild(el("h2", "", "Ask the model something"));
  hostPanel.appendChild(
    el(
      "p",
      "hint",
      "This is the “before” — a plain progress bar. Watch the same wait appear as a game on the right."
    )
  );
  const sim = el("div", "sim");
  const prog = document.createElement("progress");
  prog.max = 100;
  prog.value = 0;
  const progLabel = el("div", "", "0%");
  sim.appendChild(prog);
  sim.appendChild(progLabel);
  hostPanel.appendChild(sim);

  const buttons = el("div", "btnrow");
  const runBtn = el("button", "run", "▶ Run a fake AI wait (slow reasoning)");
  const resetBtn = el("button", "ghost", "Reset stats");
  buttons.appendChild(runBtn);
  buttons.appendChild(resetBtn);
  hostPanel.appendChild(buttons);
  hostPanel.appendChild(
    el(
      "p",
      "hint",
      "Simulates a deep-reasoning model (o1-style) that takes ~12s. Real integration: call ctrl.progress() from your model stream."
    )
  );
  grid.appendChild(hostPanel);

  const widgetPanel = el("div", "panel");
  widgetPanel.appendChild(el("div", "hostlabel", "WHILE YOU WAIT — the widget"));
  const widgetMount = el("div", "");
  widgetMount.setAttribute("data-waiting-widget", "");
  widgetPanel.appendChild(widgetMount);
  widgetPanel.appendChild(
    el(
      "p",
      "hint",
      "The game runs at 60fps and never blocks on the network. Difficulty ramps with the model's progress. When the wait ends, the streak advances."
    )
  );
  grid.appendChild(widgetPanel);

  page.appendChild(grid);

  const prizes = el("div", "section");
  prizes.appendChild(el("h2", "", "Why this wins"));
  prizes.appendChild(
    el(
      "p",
      "hint",
      "Five rubric criteria: waiting experience, originality, AI-native fit, repeatability, execution. Vote-heavy VibeFi pays toward build-to-earn."
    )
  );
  const prizeGrid = el("div", "prizes");
  prizeGrid.innerHTML = `
    <div class="prize"><div class="amt">$20k</div><div class="lbl">1st place — vanilla prize pool</div></div>
    <div class="prize"><div class="amt">$20k + 80%</div><div class="lbl">The <b>Vault</b> — for the entry that generates real revenue</div></div>
    <div class="prize"><div class="amt">64×</div><div class="lbl">Perceived-wait principle — mirrors by elevators, Chrome's dino</div></div>
  `;
  prizes.appendChild(prizeGrid);
  page.appendChild(prizes);

  const sec = el("div", "section");
  sec.appendChild(el("h2", "", "Drop-in embed — 3 lines in any AI app"));
  sec.appendChild(
    el(
      "code",
      "block",
      `import { makeItFun } from "@quickspin/sdk";
const ctrl = makeItFun({ gameId: "runner", onCheckout: (plan) => stripe.checkout(plan) });

// inside your model call, stream progress:
ctrl.progress(0.05, "Reasoning…");
ctrl.progress(0.5, "Drafting…");
ctrl.done();   // wait over — streak advances`
    )
  );
  page.appendChild(sec);

  sec.appendChild(el("h2", "", "Playable right now"));
  const gameList = el("div", "prizes");
  const rows = Object.entries(GAMES)
    .map(
      ([, g]) =>
        `<div class="prize"><div class="amt" style="font-size:16px;">${g.name}</div><div class="lbl">${g.tagline}</div></div>`
    )
    .join("");
  gameList.innerHTML = rows || `<div class="prize"><div class="lbl">No games loaded</div></div>`;
  page.appendChild(gameList);

  return page;
}

let running = false;
let ctrl: WaitingController | null = null;

function simulateWait(prog: HTMLProgressElement, label: HTMLElement, ctl: WaitingController): void {
  if (running) return;
  running = true;
  const steps = 40;
  let i = 0;
  const statuses = ["Reasoning…", "Sketching plan…", "Drafting…", "Polishing…"];
  const tick = () => {
    i++;
    const p = i / steps;
    prog.value = Math.round(p * 100);
    label.textContent = Math.round(p * 100) + "%";
    const st = statuses[Math.min(statuses.length - 1, Math.floor(i / 10))];
    ctl.progress(p, st);
    if (i < steps) {
      window.setTimeout(tick, 300);
    } else {
      ctl.done();
      running = false;
    }
  };
  tick();
}

function main(): void {
  const app = document.getElementById("app");
  if (!app) return;
  app.appendChild(buildPage());

  const mount = app.querySelector("[data-waiting-widget]") as HTMLElement;
  ctrl = makeItFun({ target: mount, onProgress: () => undefined });

  const prog = app.querySelector("progress") as HTMLProgressElement;
  const label = app.querySelector(".sim > div:last-child") as HTMLElement;
  const runBtn = app.querySelector(".run") as HTMLButtonElement;
  const resetBtn = app.querySelector(".ghost") as HTMLButtonElement;

  runBtn.addEventListener("click", () => {
    if (ctrl) simulateWait(prog, label, ctrl);
  });
  resetBtn.addEventListener("click", () => {
    resetAll();
    window.location.reload();
  });
}

main();
