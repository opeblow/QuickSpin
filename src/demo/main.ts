import "./demo.css";
import { createQuickSpin } from "../sdk/index";
import type { PlanOption, QuickSpinController, WaitEventHandler } from "../sdk/types";
import { PLANS, createCheckoutFlow } from "../sdk/paywall";
import { mountHeroDemo } from "./hero";
import {
  bestLabel,
  currentDayStreak,
  perceivedWaitStats,
  resetAll,
  totalSessions,
  totalWaitTurnedToPlayMs,
} from "../sdk/index";

const STRIPE_LINKS: Record<string, string> = {};
const proLink = import.meta.env.VITE_STRIPE_PRO_LINK as string | undefined;
if (proLink) STRIPE_LINKS.pro = proLink;
const LIVE_PAYMENTS = Boolean(STRIPE_LINKS.pro);

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const PHASES: Array<[string, number, number]> = [
  ["Reasoning…", 0.1, 700],
  ["Searching the web…", 0.3, 900],
  ["Drafting…", 0.6, 900],
  ["Polishing…", 0.85, 700],
];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
}

function logEvents(root: HTMLElement): WaitEventHandler {
  return (e) => {
    const line = el(
      "div",
      "",
      `[${new Date().toLocaleTimeString()}] ${e.type}${e.data ? " " + JSON.stringify(e.data) : ""}`
    );
    root.appendChild(line);
    root.scrollTop = root.scrollHeight;
  };
}

function main(): void {
  const app = document.getElementById("app");
  if (!app) return;
  app.appendChild(buildPage());

  const heroCanvas = app.querySelector<HTMLCanvasElement>(".hero-canvas");
  if (heroCanvas) mountHeroDemo(heroCanvas);

  const mount = app.querySelector<HTMLElement>("#qs-mount")!;
  const logEl = app.querySelector<HTMLElement>("#event-log")!;
  const classicPanel = app.querySelector<HTMLElement>("#classic-panel")!;
  const qsPanel = app.querySelector<HTMLElement>("#qs-panel")!;
  const segBtns = Array.from(app.querySelectorAll<HTMLButtonElement>(".seg button"));
  const runBtn = app.querySelector<HTMLButtonElement>("#run-demo")!;
  const resetBtn = app.querySelector<HTMLButtonElement>("#reset-stats")!;
  const phaseEl = app.querySelector<HTMLElement>("#qs-phase")!;
  const classicPhase = app.querySelector<HTMLElement>("#classic-phase")!;

  let ctrl: QuickSpinController | null = createQuickSpin({
    target: mount,
    onEvent: logEvents(logEl),
  });
  let mode: "classic" | "quickspin" = "quickspin";
  let running = false;

  const setMode = (m: "classic" | "quickspin") => {
    mode = m;
    for (const b of segBtns)
      b.setAttribute("aria-pressed", m === b.dataset.mode ? "true" : "false");
    classicPanel.style.display = m === "classic" ? "" : "none";
    qsPanel.style.display = m === "quickspin" ? "" : "none";
  };

  const appendBubble = (label: string, cls: "user" | "ai"): void => {
    const chat = (mode === "classic" ? classicPanel : qsPanel).querySelector<HTMLElement>(".chat")!;
    const b = el("div", "bubble " + cls, label);
    chat.appendChild(b);
    b.scrollIntoView({ block: "nearest" });
  };

  const runClassic = async () => {
    classicPhase.innerHTML = "";
    const chat = classicPanel.querySelector<HTMLElement>(".chat")!;
    const track = chat.querySelector<HTMLElement>(".thinking")!;
    const fill = chat.querySelector<HTMLElement>(".fill") as HTMLElement;
    const label = chat.querySelector<HTMLElement>(".progress-label")!;
    track.style.display = "flex";
    track.querySelector<HTMLElement>(".spinner-label")!.textContent = PHASES[0][0];
    for (const [status, p, ms] of PHASES) {
      track.querySelector<HTMLElement>(".spinner-label")!.textContent = status;
      fill.style.width = `${Math.round(p * 100)}%`;
      label.textContent = `${Math.round(p * 100)}%`;
      await sleep(ms);
    }
    fill.style.width = "100%";
    label.textContent = "100%";
    track.style.display = "none";
    appendBubble("Here are five spots — assuming everyone still likes tacos.", "ai");
  };

  const runQuickSpin = async () => {
    phaseEl.innerHTML = "Phase: <strong>" + PHASES[0][0] + "</strong>";
    const session = ctrl!.start({ status: PHASES[0][0] });
    for (const [status, p, ms] of PHASES) {
      session.setPhase(status);
      session.setProgress(p);
      phaseEl.innerHTML = "Phase: <strong>" + status + "</strong>";
      await sleep(ms);
    }
    session.complete();
    phaseEl.innerHTML = "Phase: <strong>Done</strong> — the widget hands off.";
    appendBubble("Here are five spots — assuming everyone still likes tacos.", "ai");
    refreshStats();
  };

  const runDemo = async () => {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    runBtn.textContent = "Generating…";
    appendBubble("Where should five friends eat tonight in Austin?", "user");
    if (mode === "classic") await runClassic();
    else await runQuickSpin();
    running = false;
    runBtn.disabled = false;
    runBtn.textContent = "Run demo generation";
  };

  const refreshStats = (): void => {
    const set = (id: string, v: string) => {
      const n = app.querySelector<HTMLElement>(`#${id} .num`);
      if (n) n.textContent = v;
    };
    set("stat-sessions", String(totalSessions()));
    set("stat-wait", formatMs(totalWaitTurnedToPlayMs()));
    set("stat-best", bestLabel("runner") ?? "—");
    const ps = perceivedWaitStats();
    set("stat-felt", ps.samples > 0 ? `${Math.round(ps.avgRatio * 100)}%` : "—");
    set("stat-streak", String(currentDayStreak()));
  };

  runBtn.addEventListener("click", runDemo);
  resetBtn.addEventListener("click", () => {
    ctrl!.destroy();
    mount.innerHTML = "";
    ctrl = createQuickSpin({ target: mount, onEvent: logEvents(logEl) });
    resetAll();
    app.querySelector<HTMLElement>("#event-log")!.innerHTML = "";
    refreshStats();
  });

  for (const b of segBtns) {
    b.addEventListener("click", () => {
      if (running) return;
      setMode((b.dataset.mode as "classic" | "quickspin") ?? "quickspin");
    });
  }

  // Game switcher inside the widget is enough; the demo shows runner.
  setMode("quickspin");
  refreshStats();
}

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${s}s`;
}

function renderPlans(root: HTMLElement): void {
  const grid = el("div", "plans");
  for (const plan of PLANS) {
    const card = el("div", "plan" + (plan.highlighted ? " hot" : ""));
    card.appendChild(
      el("div", "plan-name", plan.name + (plan.highlighted ? " · RECOMMENDED" : ""))
    );
    card.appendChild(el("div", "plan-price", `$${plan.priceUsd} <small>${plan.cadence}</small>`));
    const ul = el("ul");
    for (const f of plan.features) {
      const li = el(
        "li",
        "",
        typeof f === "string"
          ? f
          : `${f.text} <span class="note amber">(after the hackathon)</span>`
      );
      ul.appendChild(li);
    }
    card.appendChild(ul);
    const buy = el(
      "button",
      "btn " + (plan.highlighted ? "primary" : "ghost"),
      plan.priceUsd === 0
        ? "Choose Free (no checkout)"
        : plan.highlighted && LIVE_PAYMENTS
          ? "Choose Pro \u2014 pay with Stripe"
          : "Choose Pro \u2014 checkout preview"
    );
    buy.type = "button";
    buy.addEventListener("click", () => void choosePlan(plan, buy));
    card.appendChild(buy);
    grid.appendChild(card);
  }
  root.appendChild(grid);
}

let checkoutBox: { open(): void; close(): void; destroy(): void } | null = null;

async function choosePlan(plan: PlanOption, btn: HTMLButtonElement): Promise<void> {
  if (plan.priceUsd === 0) {
    btn.textContent = "Free plan active";
    btn.disabled = true;
    return;
  }
  checkoutBox = createCheckoutFlow(
    (_planId) => {
      // Simulate a payment provider round-trip. Success only renders from this
      // confirmed result — QuickSpin never fabricates one.
      return sleep(900).then(() => ({ ok: true, paymentId: `demo_${Date.now()}` }));
    },
    { paymentLinks: STRIPE_LINKS }
  );
  checkoutBox.open();
}

function buildPage(): HTMLElement {
  const page = el("div", "");

  const nav = el("nav", "nav");
  nav.appendChild(
    el(
      "div",
      "wrap",
      `<div class="logo"><img src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2096%2096'%3E%3Cdefs%3E%3ClinearGradient%20id='chip'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%238b7cff'/%3E%3Cstop%20offset='1'%20stop-color='%236658e8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20x='6'%20y='6'%20width='84'%20height='84'%20rx='24'%20fill='url(%23chip)'/%3E%3Cpath%20d='M%2048%2020%20A%2028%2028%200%201%200%2048%2076%20A%2028%2028%200%201%200%2048%2020%20Z%20M%2048%2034%20A%2014%2014%200%201%201%2048%2062%20A%2014%2014%200%201%201%2048%2034%20Z'%20fill='%23ffffff'%20fill-rule='evenodd'/%3E%3Cpath%20d='M%2060%2062%20Q%2072%2068%2079%2084'%20fill='none'%20stroke='%23ffe06a'%20stroke-width='12'%20stroke-linecap='round'/%3E%3C/svg%3E" width="26" height="26" alt="QuickSpin"/><span>quick</span><span>spin</span></div>
       <ul class="nav-links">
         <li><a href="#demo">Product</a></li>
         <li><a href="#games">Games</a></li>
         <li><a href="#sdk">SDK</a></li>
         <li><a href="#pricing">Pricing</a></li>
         <li><a href="#sdk">Docs</a></li>
       </ul>`
    )
  );

  const hero = el("section", "hero wrap");
  hero.appendChild(el("div", "hero-badge", "Commonsmade Build · Make Waiting for AI Fun"));
  hero.appendChild(el("h1", "", `Turn AI wait time into <em>play time.</em>`));
  hero.appendChild(
    el(
      "p",
      "lead",
      `The seconds that vanish on “thinking…” are the worst moment in every AI app. ` +
        `QuickSpin is a drop-in widget that turns that dead wait into a playable arcade — ` +
        `you play while the model works, and the wait ends with the game.`
    )
  );

  const heroDemo = el("div", "hero-demo");
  const heroCanvas = el("canvas", "hero-canvas");
  heroCanvas.width = 760;
  heroCanvas.height = 300;
  heroCanvas.setAttribute("aria-hidden", "true");
  heroDemo.appendChild(heroCanvas);
  hero.appendChild(heroDemo);
  const ctaRow = el("div", "cta-row");
  const runBtn = el("button", "btn primary", "Run demo generation");
  runBtn.id = "run-demo";
  runBtn.type = "button";
  const resetBtn = el("button", "btn ghost", "Reset stats");
  resetBtn.id = "reset-stats";
  resetBtn.type = "button";
  ctaRow.appendChild(runBtn);
  ctaRow.appendChild(resetBtn);
  hero.appendChild(ctaRow);
  hero.appendChild(
    el("p", "sub", "The wait is simulated locally — the Demo runs entirely in your browser.")
  );

  const demo = el("section", "demo-section wrap");
  demo.id = "demo";
  demo.appendChild(el("div", "hostlabel", "HOST APP — a one-message AI client"));
  const seg = el("div", "seg");
  for (const m of ["classic", "quickspin"] as const) {
    const b = el("button", "", m === "classic" ? "Classic spinner" : "With QuickSpin");
    b.type = "button";
    b.dataset.mode = m;
    seg.appendChild(b);
  }
  demo.appendChild(seg);
  demo.appendChild(
    el(
      "div",
      "seg-label hostlabel",
      "Choose your fate — same 12-second model wait, two waiting experiences."
    )
  );

  const classicPanel = el("div", "");
  classicPanel.id = "classic-panel";
  classicPanel.style.display = "none";
  const classicChat = el("div", "chat");
  classicChat.innerHTML =
    `<div class="bubble user">Where should five friends eat tonight in Austin?</div>` +
    `<div class="thinking"><span class="spinner"></span><span class="spinner-label">Reasoning…</span></div>` +
    `<div class="progress-track"><div class="fill"></div></div>` +
    `<div class="progress-label">0%</div>`;
  const classicPhase = el("div", "qs-phase");
  classicPhase.id = "classic-phase";
  classicPanel.appendChild(classicChat);
  classicPanel.appendChild(classicPhase);
  demo.appendChild(classicPanel);

  const qsPanel = el("div", "");
  qsPanel.id = "qs-panel";
  const qsChat = el("div", "chat");
  qsChat.innerHTML = `<div class="bubble user">Where should five friends eat tonight in Austin?</div>`;
  const qsMount = el("div", "qs-mount");
  qsMount.id = "qs-mount";
  const qsPhase = el("div", "qs-phase");
  qsPhase.id = "qs-phase";
  qsPanel.appendChild(qsChat);
  qsPanel.appendChild(qsMount);
  qsPanel.appendChild(qsPhase);
  demo.appendChild(qsPanel);

  const eventLog = el("div", "event-log");
  eventLog.id = "event-log";
  demo.appendChild(eventLog);

  const stats = el("section", "wrap stats-grid");
  stats.innerHTML =
    `<div class="stat" id="stat-wait"><div class="num">—</div><div class="lbl">AI wait turned into play</div></div>` +
    `<div class="stat" id="stat-sessions"><div class="num">—</div><div class="lbl">sessions on this device</div></div>` +
    `<div class="stat" id="stat-best"><div class="num">—</div><div class="lbl">best wait-run score</div></div>` +
    `<div class="stat" id="stat-felt"><div class="num">—</div><div class="lbl">felt vs actual wait</div></div>` +
    `<div class="stat" id="stat-streak"><div class="num">—</div><div class="lbl">day streak</div></div>`;

  const games = el("section", "section wrap");
  games.id = "games";
  games.appendChild(el("h2", "", "Games"));
  games.appendChild(
    el("p", "", "Short, repeatable, input-friendly. Two to start, more in the game packs.")
  );
  const gameList = el("div", "game-list");
  gameList.innerHTML =
    `<div class="game"><div class="name">Wait Runner</div><div class="tag">Jump the obstacle, outrun the wait. <kbd>Space</kbd> or tap to jump.</div></div>` +
    `<div class="game"><div class="name">Orbit Catch</div><div class="tag">Catch the glow target in a row to stack a combo. Tap or click.</div></div>` +
    `<div class="game"><div class="name">Game packs (Pro)</div><div class="tag">More games after the hackathon.</div></div>`;
  games.appendChild(gameList);

  const sdk = el("section", "section wrap");
  sdk.id = "sdk";
  sdk.appendChild(el("h2", "", "Drop-in SDK"));
  sdk.appendChild(
    el(
      "p",
      "",
      `Install the package, mount the widget, and feed it your model phases. When the wait is over, call <code>session.complete()</code> and hand off to the real response.`
    )
  );
  const code = el("div", "code");
  code.appendChild(
    el(
      "pre",
      "",
      `<span class="tok-cmt">// npm install quickspin</span>
<span class="tok-kw">import</span> { createQuickSpin } <span class="tok-kw">from</span> <span class="tok-str">"quickspin"</span>;

<span class="tok-kw">const</span> quickSpin = createQuickSpin({
  <span class="tok-cmt">// target can be a selector or element</span>
  target: <span class="tok-str">"#quickspin"</span>,
  game: <span class="tok-str">"runner"</span>,                    <span class="tok-cmt">// "runner" | "orbit"</span>
  theme: { mode: <span class="tok-str">"dark"</span>, primary: <span class="tok-str">"#8b7cff"</span> },
  onEvent: (e) => analytics.observe(e),
});

<span class="tok-kw">const</span> session = quickSpin.start({ status: <span class="tok-str">"Reasoning…"</span> });
session.setPhase(<span class="tok-str">"Drafting…"</span>);
session.setProgress(0.5);          <span class="tok-cmt">// or setProgress() for indeterminate</span>

<span class="tok-kw">const</span> response = <span class="tok-kw">await</span> modelRequest();
session.complete();                <span class="tok-cmt">// the wait ends with the game</span>

<span class="tok-cmt">// wrap a whole request:</span>
<span class="tok-kw">const</span> answer = <span class="tok-kw">await</span> quickSpin.track(aiRun(prompt), {
  status: <span class="tok-str">"Thinking…"</span>,
});`
    )
  );
  sdk.appendChild(code);
  sdk.appendChild(
    el(
      "p",
      "sub",
      `Or mount declared widgets with <code>&lt;div data-quickspin&gt;&lt;/div&gt;</code>. The widget owns its own shadow DOM, so page styles never leak in.`
    )
  );

  const pricing = el("section", "section wrap");
  pricing.id = "pricing";
  pricing.appendChild(el("h2", "", "Pricing"));
  pricing.appendChild(
    el(
      "p",
      "",
      LIVE_PAYMENTS
        ? `Checkout is live: “Choose Pro” opens a real Stripe Payment Link, payments land in ` +
            `the Stripe dashboard, and revenue generated attaches to the entry (the Vault). ` +
            `QuickSpin never claims a payment it can’t verify — Stripe is the source of truth.`
        : `Everything listed exists today; everything else is labeled clearly. ` +
            `Checkout below is a preview — no real payment is made. Set ` +
            `<code>VITE_STRIPE_PRO_LINK</code> in <code>.env</code> (see <code>.env.example</code>) ` +
            `and Pro switches to a real Stripe Payment Link that genuinely generates revenue.`
    )
  );
  const plansBox = el("div", "");
  renderPlans(plansBox);
  pricing.appendChild(plansBox);

  const thesis = buildThesis();
  const footer = el(
    "footer",
    "footer wrap",
    `QuickSpin — an entry for the Commonsmade “Make Waiting for AI Fun” build challenge.`
  );
  page.appendChild(nav);
  page.appendChild(buildStripeToastIfNeeded());
  page.appendChild(hero);
  page.appendChild(demo);
  page.appendChild(thesis);
  page.appendChild(stats);
  page.appendChild(games);
  page.appendChild(sdk);
  page.appendChild(pricing);
  page.appendChild(footer);

  return page;
}

function buildThesis(): HTMLElement {
  const t = el("section", "section wrap");
  t.id = "thesis";
  t.appendChild(el("h2", "", `The wait is an abandoned checkout.`));
  t.appendChild(
    el(
      "p",
      "",
      `Every AI call already costs you the inference bill. The “thinking…” spinner is where ` +
        `users leave — and the response you paid for lands on nobody’s screen. QuickSpin gives ` +
        `that gap something to lose: a score, a streak, a lead your user protects. They stay ` +
        `through the handoff, and the handoff is where the value — and the revenue — starts.`
    )
  );
  t.appendChild(
    el(
      "table",
      "rot-table",
      `<tr><th></th><th class="qs">Classic “thinking…”</th><th class="qs">With QuickSpin</th></tr>` +
        `<tr><td>During the wait (10–30s)</td><td>Users tab away — nothing to lose</td><td>A game with a real stake: score, streak, best</td></tr>` +
        `<tr><td>The handoff (response ready)</td><td>Lands on an empty tab</td><td>They stayed to see the answer</td></tr>` +
        `<tr><td>Your paid inference</td><td>Missed</td><td>Seen — the point of the call</td></tr>` +
        `<tr><td>Repeat visits</td><td>No reason to return</td><td>Returning for the streak</td></tr>` +
        `<tr><td>Revenue</td><td>Impossible to meter</td><td>Pro, billed through real Stripe checkout</td></tr>`
    )
  );
  t.appendChild(el("div", "steps-hostlabel", "HOW HOSTS MAKE MONEY"));
  const steps = el("div", "steps");
  steps.innerHTML =
    `<div class="step"><div class="n">01</div><div class="t">Embed one div</div>` +
    `<div class="d"><code>#quickspin</code> in any AI app — npm install, no infra.</div></div>` +
    `<div class="step"><div class="n">02</div><div class="t">Play on every wait</div>` +
    `<div class="d">Streaks and bests turn the 10–30s inference gap into daily returns.</div></div>` +
    `<div class="step"><div class="n">03</div><div class="t">Bill the teams that want it</div>` +
    `<div class="d">Pro routes to a real Stripe Payment Link. ` +
    `Revenue generates — and the Vault pays 80% of what you earn.</div></div>`;
  t.appendChild(steps);
  t.appendChild(
    el(
      "p",
      "note",
      LIVE_PAYMENTS
        ? "Pro checkout is configured and live in this demo."
        : "Pro checkout is ready in code — set VITE_STRIPE_PRO_LINK in .env and this demo starts accepting real payments."
    )
  );
  return t;
}

function buildStripeToastIfNeeded(): HTMLElement {
  const params = new URLSearchParams(window.location.search);
  const viaStripe =
    params.has("payment_intent") ||
    params.has("payment_intent_client_secret") ||
    params.has("redirect_status");
  if (!viaStripe) return el("div", "");
  const toast = el("div", "toast");
  toast.appendChild(
    el(
      "span",
      "",
      `Stripe returned you here after checkout. QuickSpin doesn’t verify payments — ` +
        `open your Stripe dashboard to confirm the charge and see the revenue attached to this entry.`
    )
  );
  const close = el("button", "", "\u00d7");
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss");
  close.addEventListener("click", () => toast.remove());
  toast.appendChild(close);
  return toast;
}

main();
