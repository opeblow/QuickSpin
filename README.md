<p align="center">
  <img src="assets/logo.svg" width="64" height="64" alt="QuickSpin logo" />
</p>

# QuickSpin

**Turn live AI execution into play time — and measure whether the wait actually felt better.**

QuickSpin is an embeddable waiting runtime for AI apps. Instead of leaving users on a passive
“thinking…” spinner, a host can expose its real execution phases and observed execution signals to a playable widget. When the AI
response is ready, QuickSpin ends the game cleanly and can show a **Wait Receipt** with actual wait,
engaged play time, engagement ratio, and an optional perceived-wait answer.

Built for the Commonsmade **“Make Waiting for AI Fun”** build challenge.

The repository is split in two:

- **`src/sdk/`** — the product: TypeScript SDK, two games, lifecycle, persistence, themes, events,
  Wait Receipts, and checkout helper.
- **`src/demo/`** — a one-message host app that compares the exact same 12-second simulated wait
  with a classic spinner and with QuickSpin.

## Why this is more than “a game instead of a spinner”

QuickSpin is driven by the real host request lifecycle:

1. `start()` enters an explicit `waiting` state.
2. The host can send real phase labels such as `Reasoning`, `Searching`, `Drafting`, `Polishing`.
3. If the host has a truthful progress value, `setProgress(0..1)` can drive the game.
4. If it does **not** have a truthful percentage, `setProgress()` keeps progress indeterminate and
   the observed phase changes drive gameplay intensity instead. QuickSpin does not invent progress.
5. `complete()` ends the game from live game state and hands off to the response.
6. The user can optionally report how long the wait felt; QuickSpin persists that answer and shows
   the result whether the wait felt **shorter, the same, or longer**.

## Production-friendly wait threshold

The default `delayMs` is **650ms**. Fast model calls can finish before that threshold without
flashing a game chooser into the UI. For demos, set `delayMs: 0` if you want QuickSpin to appear
immediately.

```ts
import { createQuickSpin } from "quickspin";

const quickSpin = createQuickSpin({
  target: "#quickspin",
  game: "runner",
  delayMs: 650,
  theme: { mode: "dark", primary: "#8b7cff" },
  onEvent: (event) => analytics.observe(event),
});

const session = quickSpin.start({ status: "Reasoning…" });

// No trustworthy percentage? Stay indeterminate.
session.setProgress();
session.setPhase("Searching the web…");
session.signal({
  kind: "retrieval",
  label: "Retrieved 12 sources",
  evidenceRef: "run_123:retrieval_4",
});
session.setPhase("Drafting…");
session.signal({
  kind: "artifact",
  label: "Draft assembled",
  evidenceRef: "run_123:artifact_1",
});

const response = await modelRequest();
session.complete();
```

Or wrap a promise directly:

```ts
const answer = await quickSpin.track(aiRun(prompt), {
  status: "Thinking…",
});
```

## Execution Signals

`setPhase()` changes the pace of the waiting game. `signal()` goes one level deeper: it lets a host
turn a **real observed runtime event** into game content. QuickSpin supports four intentionally small
semantic kinds: `retrieval`, `tool`, `artifact`, and `warning`.

```ts
session.signal({
  kind: "retrieval",
  label: "Retrieved 12 sources",
  evidenceRef: "run_123:retrieval_4",
});
session.signal({
  kind: "tool",
  label: "Called maps search",
  evidenceRef: "run_123:tool_2",
});
session.signal({
  kind: "artifact",
  label: "Draft assembled",
  evidenceRef: "run_123:artifact_1",
});
```

Wait Runner emits those events as collectible diamonds; Orbit Catch attaches them to catchable
targets. A signal only changes the score after the player actually interacts with it. Signals that
arrive before the player starts are queued briefly and delivered when gameplay begins.

**Epistemic rule:** QuickSpin never infers these events from elapsed time, phase names, or animation.
The host must call `session.signal(...)` from something it genuinely observed in its own AI runtime,
and attach a host-owned `evidenceRef`. If kind, label, or evidence reference is missing, QuickSpin emits
`signal-rejected` with `UNKNOWN / INSUFFICIENT_EVIDENCE` and does not mutate gameplay. If the host has
no trustworthy event, it should abstain instead of manufacturing one.

## Negative path: real failure > fake success

The demo includes a **Run negative-path proof** control. It runs an actual Promise that rejects with
`DEMO_PROVIDER_TIMEOUT`; QuickSpin records the session as `failed`, emits structured failure data,
and deliberately does **not** append an AI answer. The failure remains in local session evidence.
This is controlled runtime evidence, not a claim that a live provider failed during the recording.

The problem also has a real-world anchor: on **June 2, 2026**, OpenAI reported elevated errors and
latency across the Responses API, Codex, and ChatGPT; affected Responses API traffic took longer than
normal to begin generating responses. See `evidence/REALITY-ANCHOR.md` for the source and the five-part
problem→impact→design→mitigation chain.

## Wait Receipt

After a completed visible wait, QuickSpin can show:

- **Actual** — real elapsed request time.
- **Played** — time actually spent in a running game.
- **Engaged** — played / actual wait ratio.
- **Felt** — optional user-reported perceived wait.

The perception calculation is signed. A wait that felt longer is reported as longer; it is never
clamped to a fake “0% improvement.” The underlying record is updated in `localStorage`, so aggregate
`perceivedWaitStats()` is based on real submitted answers.

Relevant events include `session-start`, `phase`, `progress`, `signal`, `signal-rejected`, `game-start`, `session-complete`,
`perceived-wait`, `receipt`, `cancel`, and `fail`.

## Games

### Wait Runner

Jump obstacles while the host request is running. Keyboard and pointer are supported (`Space` or
tap/click). Pace follows truthful host progress when available, otherwise phase-derived intensity.

### Orbit Catch

Catch the moving glow target and build a combo. Pointer users tap/click the target. Keyboard users
focus the canvas and press `Space` or `Enter`, making the game operable without pointer input.

## Collapse without losing the widget

The header collapse control no longer removes the entire host element. It becomes a compact live
pill (`QuickSpin · Drafting… · 8s`) with a **Resume play** control, while the game pauses. Public
`hide()` / `show()` remain available when a host intentionally wants to hide the whole widget.

## Streaks and local metrics

- `dayStreak` is recomputed from persisted completed sessions.
- `sessionStreak` is also recomputed from persisted records rather than an in-memory-only counter.
- Personal bests and leaderboard remain local to the device.
- `totalWaitTurnedToPlayMs()` now sums **engaged play time**, not every completed wait regardless of
  whether the user played.

## Declarative and React mounting

Plain HTML:

```html
<div id="quickspin"></div>
<script src="quickspin.iife.js"></script>
<script>
  QuickSpin.autoInit();
</script>
```

`autoInit()` hydrates both `[data-quickspin]` and `#quickspin`. Declarative mounts can optionally use
`data-quickspin-delay="900"`.

React:

```tsx
import { QuickSpinWidget } from "quickspin/react";

<QuickSpinWidget
  game="orbit"
  delayMs={650}
  theme={{ mode: "light" }}
  onReady={(controller) => {
    const session = controller.start({ status: "Reasoning…" });
    session.setProgress();
  }}
/>;
```

## Widget behavior

- One animation loop owned by the widget; games do not race the network with separate RAF loops.
- Game ticking pauses when the document is hidden, the widget is collapsed, or the host hides it.
- Shadow DOM + CSS variables isolate host and widget styles.
- `role="status"`, `aria-live`, focus-visible styles, keyboard controls, and reduced-motion CSS are
  included.
- Starting a new session after `completed`, `cancelled`, or `failed` explicitly resets the lifecycle
  through `idle → waiting`.

## Pricing and checkout: honest separation

The current SDK capabilities are **not falsely paywalled**. Free includes the current games,
phase-aware runtime, themes, analytics events, local streaks/bests, and Wait Receipts.

The **Team Pilot** is positioned as a service layer for branded setup and priority integration
support. Hosted cross-device analytics and additional game packs are labeled **after the hackathon**
until they actually exist.

If `VITE_STRIPE_PRO_LINK` is supplied, the paid plan opens a real Stripe Payment Link. Without it,
the demo shows a clearly labeled checkout preview. QuickSpin does not infer payment success from a
return URL; Stripe remains the payment source of truth.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + prettier + vitest + SDK build
npm run build      # demo production build
npm run preview
```

The demo model wait is simulated locally and lasts **exactly 12 seconds** in both Classic and
QuickSpin modes.

## SDK build and release

```bash
npm run build:sdk
```

Produces `dist/` with ESM, CJS, browser IIFE, React entry, and `.d.ts` types.

A `v*` Git tag triggers the release workflow, which now:

1. runs the full SDK verification suite,
2. builds the demo,
3. verifies both `dist/` and `dist-demo/` exist,
4. publishes separate SDK and demo tarballs in the GitHub Release.

The package is structured to be publishable, but this README does not claim an npm release exists
until one is actually published.

## Project layout

```text
.
├── index.html
├── src/
│   ├── sdk/
│   │   ├── index.ts
│   │   ├── widget.ts
│   │   ├── state-machine.ts
│   │   ├── runner.ts
│   │   ├── orbit.ts
│   │   ├── persistence.ts
│   │   ├── paywall.ts
│   │   ├── styles.ts
│   │   └── types.ts
│   ├── react/QuickSpinWidget.tsx
│   ├── test/setup.ts
│   └── demo/
├── .env.example
├── vite.config.lib.ts
├── vite.config.iife.ts
└── vitest.config.ts
```

## License

MIT — see `LICENSE`.
