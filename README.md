# QuickSpin

> Turn AI wait time into play time — an embeddable wait-game SDK for any AI app.

Built for the **Commonsmade "Make Waiting for AI Fun" build challenge**.

The seconds that vanish on a "thinking…" spinner are the weakest moment in every AI product.
QuickSpin swaps that dead wait for a playable arcade inside a drop-in widget: your users play
while the model reasons, and the wait ends with the game.

The repo is split in two:

- **`src/sdk/`** — the actual product. A TypeScript library you can `npm install` and drop into any
  AI app (the games, the widget, sessions, streaks, and the checkout preview).
- **`src/demo/`** — a demo host app: a one-message AI client whose simulated model wait appears as
  a classic spinner (before) or as a QuickSpin game (after).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The demo runs entirely in your browser. The "AI wait" is simulated locally.

Full local suite:

```bash
npm run check      # typecheck + prettier + vitest + SDK build (ESM/CJS/IIFE + .d.ts)
npm run build      # demo production build (tsc --noEmit + vite build)
npm run preview    # serve the demo build
```

## Integrate in any AI app

```ts
import { createQuickSpin } from "quickspin";

const quickSpin = createQuickSpin({
  target: "#quickspin", // or an element
  game: "runner", // "runner" | "orbit"
  theme: { mode: "dark", primary: "#8b7cff" },
  onEvent: (e) => analytics.observe(e), // session-start, phase, progress, session-complete…
});

const session = quickSpin.start({ status: "Reasoning…" });
session.setPhase("Drafting…");
session.setProgress(0.5); // or setProgress() for indeterminate — most hosts know the
// phase but not a truthful percentage
const response = await modelRequest();
session.complete(); // the wait ends with the game, and the widget hands off

// Or wrap the whole request:
const answer = await quickSpin.track(aiRun(prompt), { status: "Thinking…" });
// rejection calls session.fail(error) automatically
```

No-progress hosts can skip `setProgress` entirely — the widget shows an indeterminate bar and the
games ramp on phase changes. There is **no fabricated state anywhere**: scores come from real game
state at `complete()` time, and streaks are recomputed from persisted sessions.

Declarative mounting for plain pages:

```html
<div id="quickspin"></div>
<!-- `quickspin.iife.js` sets up window.QuickSpin -->
<script>
  QuickSpin.autoInit(); // hydrates every [data-quickspin] + #quickspin
</script>
```

React:

```tsx
import { QuickSpinWidget } from "quickspin/react";

<QuickSpinWidget
  game="orbit"
  theme={{ mode: "light" }}
  onReady={(c) => {
    mySession = c.start({ status: "Reasoning…" });
  }}
/>;
```

## Widget behavior

- Own **one animation loop** — games run at 60fps and never race the network; the widget pauses
  when hidden or when the tab is hidden.
- **Shadow DOM** + CSS variables: page styles can't leak in, and the SDK's styles can't leak out.
  Themes are `{ mode, primary, surface, elevated, game, text, muted, border, success, radius, font }`.
- **Perceived-wait question** after every completed wait ("That took 18s. How long did it feel?").
  The felt-vs-actual reduction is emitted as a `perceived-wait` event — real data you can use.
- **Honest streaks** — `dayStreak` (consecutive calendar days) and `sessionStreak` (consecutive
  completed waits). Personal bests and the leaderboard are **local** (this device / `localStorage`).
- Keyboard + pointer for every game, `role="status"` aria-live updates, focusable controls, and
  `prefers-reduced-motion` styles.

## Pricing (checkout preview)

The pricing section lists **only features that exist today**; anything planned is labeled
"after the hackathon". The widget itself never shows pricing — checkout lives on the host's page.

```ts
const checkout = createCheckoutFlow(async (planId) => {
  const res = await stripe.checkout({ priceId: priceFor(planId) });
  return { ok: res.succeeded, paymentId: res.id };
});
checkout.open();
```

Success is only ever rendered from that callback's result — the SDK never claims a payment was
made. In the demo it's a labeled preview; no real payment is made.

## SDK build

```bash
npm run build:sdk
```

Produces `dist/` with ESM (`quickspin.js`), CJS (`quickspin.cjs`), a browser IIFE
(`quickspin.iife.js`), the React entry (`quickspin-react.js` / `.cjs`), and `.d.ts` types — wired up
through `exports` in `package.json` (`quickspin` and `quickspin/react` subpaths).

## Project layout

```
.
├── index.html                  # demo entry
├── src/
│   ├── sdk/
│   │   ├── index.ts            # public API, autoInit, window.QuickSpin
│   │   ├── widget.ts           # controller: one RAF loop, sessions, overlays, themes
│   │   ├── state-machine.ts    # explicit session lifecycle (no progress inference)
│   │   ├── runner.ts           # Wait Runner — pure physics + canvas game
│   │   ├── orbit.ts            # Orbit Catch — multi-catch, combo-scored
│   │   ├── persistence.ts      # metrics, streaks, local bests (localStorage)
│   │   ├── paywall.ts          # honest plans + checkout preview
│   │   ├── styles.ts           # shadow-DOM widget CSS (CSS-variable themes)
│   │   └── types.ts            # contracts
│   ├── react/QuickSpinWidget.tsx  # React wrapper (quickspin/react)
│   ├── test/setup.ts           # vitest localStorage shim
│   └── demo/                   # landing page + before/after host demo
├── vite.config.lib.ts          # ESM+CJS lib build
├── vite.config.iife.ts         # IIFE build
├── tsconfig.lib.json           # .d.ts build
└── vitest.config.ts
```

## FAQ

**What exactly was built?** For the "Make Waiting for AI Fun" challenge: a product that makes the
AI waiting window enjoyable, repeatable (streaks, bests, perceived-wait data), and monetizable —
without pretending features exist yet.

**Why a widget instead of one game?** Repeatability. A single novelty game is a one-time novelty. A
layer that gamifies _every_ wait in _every_ AI app brings users back dozens of times a day.

## License

MIT — see [LICENSE](LICENSE).
