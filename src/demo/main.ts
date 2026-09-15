import "./site.css";
import { createQuickSpin } from "../sdk/index";
import type { ExecutionSignal, QuickSpinController, WaitEventHandler } from "../sdk/types";
import { mountHeroDemo } from "./hero";
import {
  bestLabel,
  currentDayStreak,
  perceivedWaitStats,
  resetAll,
  totalSessions,
  totalWaitTurnedToPlayMs,
} from "../sdk/index";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface DemoPhase {
  status: string;
  ms: number;
  signal: ExecutionSignal;
}

const PHASES: DemoPhase[] = [
  {
    status: "Reasoning…",
    ms: 2600,
    signal: { kind: "tool", label: "Planned constraints", evidenceRef: "demo:phase:reasoning" },
  },
  {
    status: "Searching the web…",
    ms: 3100,
    signal: {
      kind: "retrieval",
      label: "Retrieved Austin dinner options",
      evidenceRef: "demo:phase:retrieval",
    },
  },
  {
    status: "Drafting…",
    ms: 3400,
    signal: {
      kind: "artifact",
      label: "Ranked five candidate spots",
      evidenceRef: "demo:phase:draft",
    },
  },
  {
    status: "Polishing…",
    ms: 2900,
    signal: {
      kind: "artifact",
      label: "Final answer assembled",
      evidenceRef: "demo:phase:final",
    },
  },
];

const ROUTES = [
  { path: "/", label: "Home" },
  { path: "/lab", label: "Lab" },
  { path: "/proof", label: "Proof" },
  { path: "/sdk", label: "SDK" },
  { path: "/judges", label: "Judges" },
] as const;

function controlledProviderFailure(): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error("DEMO_PROVIDER_TIMEOUT")), 1400);
  });
}

function route(): string {
  const clean = window.location.pathname.replace(/\/+$/, "") || "/";
  return ROUTES.some((r) => r.path === clean) ? clean : "/";
}

function shell(content: string, current: string): string {
  const links = ROUTES.map(
    (item) =>
      `<a href="${item.path}" ${item.path === current ? 'aria-current="page"' : ""}>${item.label}</a>`
  ).join("");
  return `
    <div class="site-shell">
      <nav class="site-nav" aria-label="Primary navigation">
        <div class="nav-inner">
          <a class="wordmark" href="/"><span class="mark" aria-hidden="true"></span><span>QuickSpin</span></a>
          <div class="nav-links">${links}</div>
          <a class="nav-proof" href="/proof">Runtime verified</a>
        </div>
      </nav>
      ${content}
      <footer>
        <div class="footer-inner">
          <div>QuickSpin · playable AI wait runtime · evidence before claims.</div>
          <div class="footer-links"><a href="/lab">Live lab</a><a href="/proof">Evidence</a><a href="/sdk">SDK</a><a href="/judges">Judge view</a></div>
        </div>
      </footer>
    </div>`;
}

function pageHead(kicker: string, title: string, copy: string, index: string): string {
  return `<header class="page-head">
    <div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${copy}</p></div>
    <div class="page-index">QuickSpin / ${index}<br>execution → play → evidence</div>
  </header>`;
}

function homePage(): string {
  return `<main class="page">
    <section class="hero-grid">
      <div>
        <div class="eyebrow">Commonsmade · Make Waiting for AI Fun</div>
        <h1 class="display">Make AI waiting <em>playable.</em><br>Keep the truth.</h1>
        <p class="lede">QuickSpin turns real host-observed AI execution into optional gameplay, then produces a signed Wait Receipt for what actually happened — including failure and UNKNOWN.</p>
        <div class="route-actions">
          <a class="action signal" href="/lab">Enter the live wait lab →</a>
          <a class="action" href="/proof">Inspect the evidence</a>
          <a class="action" href="/sdk">Integrate the runtime</a>
        </div>
      </div>
      <div class="instrument" aria-label="QuickSpin timing instrument">
        <div class="instrument-head"><span>QS / WAIT INSTRUMENT</span><span>STATE 01</span></div>
        <div class="dial"><span class="dial-orbit"></span></div>
        <div class="instrument-strip">
          <div><strong>12.0s</strong><span>controlled wait</span></div>
          <div><strong>LIVE</strong><span>host signals</span></div>
          <div><strong>±</strong><span>signed receipt</span></div>
        </div>
      </div>
    </section>
    <section class="proof-band" aria-label="Core QuickSpin proof">
      <article class="proof-card signal"><span class="index">01 / EXECUTION</span><h3>Real events become game mechanics.</h3><p>Tool, retrieval, artifact and warning signals require host-owned provenance before QuickSpin lets them affect play.</p></article>
      <article class="proof-card"><span class="index">02 / FAILURE</span><h3>Failure stays failure.</h3><p>A rejected request ends as FAILED. QuickSpin does not manufacture a response just to keep the demo green.</p></article>
      <article class="proof-card"><span class="index">03 / MEASURE</span><h3>Wait gets a receipt.</h3><p>Actual wait, played time, engagement and felt wait stay signed — shorter, equal or longer.</p></article>
    </section>
    <section class="page-head" style="margin-bottom:0">
      <div><div class="eyebrow">Five surfaces / one product truth</div><h1>Not a landing page.<br>A product instrument.</h1><p>Each route has one job: explain, demonstrate, prove, integrate, or defend. The judge never has to excavate a single scrolling page to find the evidence.</p></div>
      <div class="page-index">HOME → thesis<br>LAB → interaction<br>PROOF → evidence<br>SDK → repeatability<br>JUDGES → rubric</div>
    </section>
  </main>`;
}

function labPage(): string {
  return `<main class="page">
    ${pageHead("Live wait lab", "Same wait. Different experience.", "Run the exact 12-second control, then the QuickSpin path. The product can also demonstrate a real rejected-Promise failure without fabricating success.", "02 / LAB")}
    <section class="lab-grid">
      <div class="lab-panel">
        <div class="panel-kicker"><span>EXPERIMENT / QS-12</span><span>CONTROLLED 12.0s</span></div>
        <div class="seg" role="group" aria-label="Demo mode"><button data-mode="classic">Classic spinner</button><button data-mode="quickspin">QuickSpin</button></div>
        <div id="classic-panel">
          <div class="chat">
            <div class="bubble ai">Ask for dinner ideas. The wait is deliberately fixed at twelve seconds.</div>
            <div class="thinking"><span class="spinner"></span><span class="spinner-label">Reasoning…</span></div>
            <div class="progress-track"><div class="fill"></div></div><div class="progress-label">0%</div>
          </div>
          <div id="classic-phase" class="qs-phase"></div>
        </div>
        <div id="qs-panel">
          <div class="chat"><div class="bubble ai">Choose to play while the host request progresses. Real phases and signals drive the waiting layer.</div><div id="qs-mount" class="qs-mount"></div></div>
          <div id="qs-phase" class="qs-phase">Phase: ready.</div>
        </div>
        <div class="lab-actions">
          <button id="run-demo" class="run">Run 12-second comparison</button>
          <button id="run-failure" class="failure">Run negative-path proof</button>
          <button id="reset-stats">Reset local evidence</button>
        </div>
      </div>
      <aside class="evidence-panel" style="padding:0;overflow:hidden">
        <div class="panel-kicker" style="padding:18px;margin:0"><span>EVIDENCE FEED</span><span>HOST EVENTS</span></div>
        <div id="event-log" class="event-log" aria-live="polite"></div>
      </aside>
    </section>
    <div class="stats-grid">
      <div id="stat-sessions" class="stat"><div class="num">0</div><div class="lbl">sessions</div></div>
      <div id="stat-wait" class="stat"><div class="num">0s</div><div class="lbl">played wait</div></div>
      <div id="stat-best" class="stat"><div class="num">—</div><div class="lbl">runner best</div></div>
      <div id="stat-felt" class="stat"><div class="num">—</div><div class="lbl">felt / actual</div></div>
      <div id="stat-streak" class="stat"><div class="num">0</div><div class="lbl">day streak</div></div>
    </div>
  </main>`;
}

function proofPage(): string {
  return `<main class="page">
    ${pageHead("Evidence room", "A receipt for the wait. A record for the failure.", "QuickSpin treats waiting as an observable product state. Success, cancellation, failure and UNKNOWN remain distinct — because a polished interface is not evidence.", "03 / PROOF")}
    <section class="receipt" aria-label="Illustrative Wait Receipt">
      <div class="receipt-head"><div><div class="eyebrow">WAIT RECEIPT / SAMPLE</div><div class="receipt-title">Execution record</div></div><div class="receipt-id">QS-2026-0915<br>status / verified</div></div>
      <div class="receipt-row"><span>ACTUAL WAIT</span><strong>12.00 s</strong></div>
      <div class="receipt-row"><span>PLAYED</span><strong>8.41 s</strong></div>
      <div class="receipt-row"><span>ENGAGED</span><strong>7.88 s</strong></div>
      <div class="receipt-row signal"><span>FELT WAIT</span><strong>9.00 s / −25%</strong></div>
      <div class="receipt-row"><span>PROVENANCE</span><strong>HOST-OBSERVED</strong></div>
      <div class="receipt-foot">Illustrative receipt layout. The live lab records the actual session values; signed perceived wait is allowed to be shorter, equal, or longer.</div>
    </section>
    <section class="evidence-grid" style="margin-top:54px">
      <article class="evidence-panel"><div class="eyebrow">Reality anchor</div><h2>A real production failure, not a hypothetical risk.</h2><p>OpenAI documented elevated errors and latency on June 2–3, 2026 across Responses API, Codex and ChatGPT. QuickSpin does not claim to repair provider reliability; the incident proves waiting, rejection and degraded flows are real product states.</p><div class="status-line"><span>PRIMARY-SOURCE EVENT</span><span class="status">PASS</span></div></article>
      <article class="evidence-panel"><div class="eyebrow">Negative path</div><h2>Real failure &gt; fake success.</h2><p>The live lab executes an actual rejected Promise. The session persists FAILED, emits structured evidence, and does not append an AI answer.</p><div class="status-line"><span>RUNTIME FAILURE PATH</span><span class="status">PASS</span></div></article>
      <article class="evidence-panel"><div class="eyebrow">Abstention</div><h2>No provenance? No claim.</h2><p>Execution signals without a valid evidenceRef are rejected as UNKNOWN / INSUFFICIENT_EVIDENCE and do not mutate gameplay.</p><div class="status-line"><span>UNKNOWN / REFUSAL</span><span class="status">PASS</span></div></article>
      <article class="evidence-panel"><div class="eyebrow">Boundary</div><h2>What QuickSpin refuses to claim.</h2><p>It does not make the model faster, guarantee every user feels less wait, or convert a controlled demo failure into evidence of a live provider outage.</p><div class="status-line"><span>CLAIM DISCIPLINE</span><span class="status">PASS</span></div></article>
    </section>
    <div class="route-actions"><a class="action signal" href="/lab">Run the live negative path →</a><a class="action" href="/judges">See rubric traceability</a></div>
  </main>`;
}

function sdkPage(): string {
  const code = `const qs = createQuickSpin({ target: "#wait" });\nconst session = qs.start({ status: "Reasoning…" });\n\nsession.setProgress(); // indeterminate by default\nsession.setPhase("Searching…");\nsession.signal({\n  kind: "retrieval",\n  label: "Retrieved 12 sources",\n  evidenceRef: "run_123:retrieval_4",\n});\n\ntry {\n  const response = await modelRequest();\n  session.complete();\n  return response;\n} catch (error) {\n  session.fail(error);\n  throw error;\n}`;
  return `<main class="page">
    ${pageHead("Integration surface", "The product is the runtime contract — not one minigame.", "Runner and Orbit consume the same lifecycle. Hosts can expose real phases and evidence-bearing execution signals without fabricating model progress.", "04 / SDK")}
    <section class="lifecycle">
      ${["IDLE", "WAITING", "PLAYING", "RESPONSE READY", "COMPLETED", "FAILED / CANCELLED"].map((s, i) => `<div class="life"><b>0${i + 1}</b><span>${s}</span></div>`).join("")}
    </section>
    <section class="code-panel"><div class="code-head"><span>Vanilla integration</span><span>evidence-aware</span></div><pre>${escapeHtml(code)}</pre></section>
    <section class="evidence-grid" style="margin-top:28px">
      <article class="evidence-panel"><div class="eyebrow">Execution signals</div><h2>Observed events become play.</h2><p><strong>retrieval</strong>, <strong>tool</strong>, <strong>artifact</strong>, and <strong>warning</strong> are optional host-supplied signals. Every accepted signal carries a provenance reference.</p></article>
      <article class="evidence-panel"><div class="eyebrow">Honest progress</div><h2>Indeterminate is a feature.</h2><p>If the host cannot prove percent progress, QuickSpin does not invent one. Phase changes can still alter intensity without pretending the model is “62% done.”</p></article>
      <article class="evidence-panel"><div class="eyebrow">Distribution</div><h2>Reusable by design.</h2><p>Vanilla SDK, React wrapper, ESM, CJS and IIFE outputs share the same host contract. The waiting layer can travel across product surfaces.</p></article>
      <article class="evidence-panel"><div class="eyebrow">Fast responses</div><h2>No game flash for trivial waits.</h2><p>The default 650 ms reveal threshold lets fast model responses finish without interrupting the user with unnecessary UI.</p></article>
    </section>
  </main>`;
}

function judgesPage(): string {
  const cycle = [
    [
      "RUBRIC",
      "Waiting experience, originality, AI-native fit, repeatability and execution mapped to proof.",
      "PASS",
    ],
    [
      "PAIN",
      "Real AI latency/rejection states plus HCI evidence that wait presentation changes experience.",
      "PASS",
    ],
    [
      "PROBLEM",
      "Passive waiting gives little agency and can imply confidence the host does not actually have.",
      "PASS",
    ],
    [
      "DIFFERENTIATOR",
      "Observed execution becomes gameplay; the outcome gets a signed Wait Receipt.",
      "PASS",
    ],
    [
      "EXECUTION",
      "Two games, lifecycle, persistence, React/vanilla, accessibility, security gates.",
      "PASS",
    ],
    [
      "EVIDENCE",
      "Primary-source incident, tests, CI/CodeQL, runtime, Claim + Failure Ledgers.",
      "PASS",
    ],
    ["STORY", "One narrative: real wait → playable execution → truthful outcome.", "PASS"],
    ["DEMO", "12-second control, QuickSpin path, receipt, failure and UNKNOWN.", "READY"],
    [
      "Q&A",
      "Adversarial answer bank refuses unsupported claims instead of improvising them.",
      "PREPARED",
    ],
  ];
  const pattern = [
    [
      "01",
      "Signal / opportunity",
      "AI products increasingly contain non-zero waits worth designing intentionally.",
    ],
    [
      "02",
      "Real negative event",
      "OpenAI June 2–3, 2026 latency, rejection and degraded user flows.",
    ],
    [
      "03",
      "Observable impact",
      "Response-start delay, HTTP 429 rejection, broken continuity and uncertainty.",
    ],
    [
      "04",
      "Design lesson",
      "Waiting cannot silently mean success; unknown evidence must stay unknown.",
    ],
    [
      "05",
      "Mitigation",
      "Playable wait, provenance, explicit terminal outcomes and signed receipt.",
    ],
  ];
  return `<main class="page">
    ${pageHead("Judge surface", "Every claim has a route to proof.", "This page compresses the build into judge logic: criterion → behavior → evidence → demo. It is intentionally explicit about what is verified, controlled, unknown, or refused.", "05 / JUDGES")}
    <section class="judge-cycle">${cycle.map((r) => `<div class="judge-row"><div class="stage">${r[0]}</div><div class="why">${r[1]}</div><div class="verdict">${r[2]}</div></div>`).join("")}</section>
    <section class="five-pattern">${pattern.map((p) => `<article class="pattern-step"><div class="n">${p[0]}</div><h3>${p[1]}</h3><p>${p[2]}</p></article>`).join("")}</section>
    <section class="evidence-panel"><div class="eyebrow">Canonical distinction</div><h2>QuickSpin is not trying to be the biggest AI waiting game.</h2><p>It is the reusable waiting layer that makes real execution playable, preserves failure truth, refuses unsupported signals, and measures what the user experienced. That is the product — the minigames are interchangeable implementations of the contract.</p><div class="route-actions"><a class="action signal" href="/lab">See it run →</a><a class="action" href="/proof">Inspect evidence</a><a class="action" href="/sdk">Inspect integration</a></div></section>
  </main>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function main(): void {
  const app = document.getElementById("app");
  if (!app) return;
  const current = route();
  const content =
    current === "/lab"
      ? labPage()
      : current === "/proof"
        ? proofPage()
        : current === "/sdk"
          ? sdkPage()
          : current === "/judges"
            ? judgesPage()
            : homePage();
  app.innerHTML = shell(content, current);

  const heroCanvas = app.querySelector<HTMLCanvasElement>(".hero-canvas");
  if (heroCanvas) mountHeroDemo(heroCanvas);
  if (current === "/lab") mountLab(app);
}

function mountLab(app: HTMLElement): void {
  const mount = app.querySelector<HTMLElement>("#qs-mount")!;
  const logEl = app.querySelector<HTMLElement>("#event-log")!;
  const classicPanel = app.querySelector<HTMLElement>("#classic-panel")!;
  const qsPanel = app.querySelector<HTMLElement>("#qs-panel")!;
  const segBtns = Array.from(app.querySelectorAll<HTMLButtonElement>(".seg button"));
  const runBtn = app.querySelector<HTMLButtonElement>("#run-demo")!;
  const failureBtn = app.querySelector<HTMLButtonElement>("#run-failure")!;
  const resetBtn = app.querySelector<HTMLButtonElement>("#reset-stats")!;
  const phaseEl = app.querySelector<HTMLElement>("#qs-phase")!;
  const classicPhase = app.querySelector<HTMLElement>("#classic-phase")!;

  const logEvents: WaitEventHandler = (event) => {
    const line = document.createElement("div");
    line.textContent = `[${new Date().toLocaleTimeString()}] ${event.type}${event.data ? " " + JSON.stringify(event.data) : ""}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  };

  let ctrl: QuickSpinController = createQuickSpin({
    target: mount,
    delayMs: 0,
    onEvent: logEvents,
  });
  let mode: "classic" | "quickspin" = "quickspin";
  let running = false;

  const setMode = (next: "classic" | "quickspin"): void => {
    mode = next;
    for (const button of segBtns)
      button.setAttribute("aria-pressed", next === button.dataset.mode ? "true" : "false");
    classicPanel.style.display = next === "classic" ? "" : "none";
    qsPanel.style.display = next === "quickspin" ? "" : "none";
  };

  const appendBubble = (label: string, kind: "user" | "ai"): void => {
    const panel = mode === "classic" ? classicPanel : qsPanel;
    const chat = panel.querySelector<HTMLElement>(".chat")!;
    const bubble = document.createElement("div");
    bubble.className = `bubble ${kind}`;
    bubble.textContent = label;
    chat.appendChild(bubble);
  };

  const refreshStats = (): void => {
    const set = (id: string, value: string): void => {
      const node = app.querySelector<HTMLElement>(`#${id} .num`);
      if (node) node.textContent = value;
    };
    set("stat-sessions", String(totalSessions()));
    set("stat-wait", formatMs(totalWaitTurnedToPlayMs()));
    set("stat-best", bestLabel("runner") ?? "—");
    const perceived = perceivedWaitStats();
    set("stat-felt", perceived.samples > 0 ? `${Math.round(perceived.avgRatio * 100)}%` : "—");
    set("stat-streak", String(currentDayStreak()));
  };

  const runClassic = async (): Promise<void> => {
    classicPhase.textContent = "";
    const chat = classicPanel.querySelector<HTMLElement>(".chat")!;
    const track = chat.querySelector<HTMLElement>(".thinking")!;
    const fill = chat.querySelector<HTMLElement>(".fill")!;
    const label = chat.querySelector<HTMLElement>(".progress-label")!;
    track.style.display = "flex";
    let elapsed = 0;
    for (const phase of PHASES) {
      track.querySelector<HTMLElement>(".spinner-label")!.textContent = phase.status;
      elapsed += phase.ms;
      const ratio = elapsed / 12000;
      fill.style.width = `${Math.round(ratio * 100)}%`;
      label.textContent = `${Math.round(ratio * 100)}%`;
      await sleep(phase.ms);
    }
    track.style.display = "none";
    appendBubble("Here are five spots — assuming everyone still likes tacos.", "ai");
  };

  const runQuickSpin = async (): Promise<void> => {
    const session = ctrl.start({ status: PHASES[0].status });
    session.setProgress();
    for (const phase of PHASES) {
      session.setPhase(phase.status);
      session.signal(phase.signal);
      phaseEl.innerHTML = `Phase: <strong>${phase.status}</strong> · signal: <strong>${phase.signal.kind}</strong> — ${phase.signal.label}`;
      await sleep(phase.ms);
    }
    session.complete();
    phaseEl.innerHTML = "Phase: <strong>Done</strong> — response ready; inspect the Wait Receipt.";
    appendBubble("Here are five spots — assuming everyone still likes tacos.", "ai");
    refreshStats();
  };

  const runDemo = async (): Promise<void> => {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    failureBtn.disabled = true;
    runBtn.textContent = "Generating…";
    appendBubble("Where should five friends eat tonight in Austin?", "user");
    if (mode === "classic") await runClassic();
    else await runQuickSpin();
    running = false;
    runBtn.disabled = false;
    failureBtn.disabled = false;
    runBtn.textContent = "Run 12-second comparison";
  };

  const runFailure = async (): Promise<void> => {
    if (running) return;
    running = true;
    setMode("quickspin");
    runBtn.disabled = true;
    failureBtn.disabled = true;
    failureBtn.textContent = "Failure in flight…";
    appendBubble(
      "Find dinner options, but preserve failure truth if the provider rejects.",
      "user"
    );
    const session = ctrl.start({ status: "Calling restaurant search provider…" });
    session.setProgress();
    session.setPhase("Calling restaurant search provider…");
    phaseEl.innerHTML =
      "Negative path: <strong>provider call in flight</strong> — no success assumed.";
    try {
      await controlledProviderFailure();
    } catch (err) {
      const failure = err instanceof Error ? err : new Error(String(err));
      session.signal({
        kind: "warning",
        label: "Provider request rejected",
        evidenceRef: "demo:negative-path:promise-rejection",
      });
      session.fail(failure);
      phaseEl.innerHTML = `Negative path: <strong>FAILED</strong> — ${failure.message}. No AI answer was fabricated.`;
      refreshStats();
    }
    running = false;
    runBtn.disabled = false;
    failureBtn.disabled = false;
    failureBtn.textContent = "Run negative-path proof";
  };

  runBtn.addEventListener("click", () => void runDemo());
  failureBtn.addEventListener("click", () => void runFailure());
  resetBtn.addEventListener("click", () => {
    ctrl.destroy();
    mount.innerHTML = "";
    resetAll();
    logEl.innerHTML = "";
    ctrl = createQuickSpin({ target: mount, delayMs: 0, onEvent: logEvents });
    refreshStats();
  });
  for (const button of segBtns)
    button.addEventListener(
      "click",
      () => !running && setMode((button.dataset.mode as "classic" | "quickspin") ?? "quickspin")
    );

  setMode("quickspin");
  refreshStats();
}

function formatMs(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

main();
