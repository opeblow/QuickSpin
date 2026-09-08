<p align="center">
  <img
    src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2096%2096'%3E%3Cdefs%3E%3ClinearGradient%20id='chip'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%238b7cff'/%3E%3Cstop%20offset='1'%20stop-color='%236658e8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20x='6'%20y='6'%20width='84'%20height='84'%20rx='24'%20fill='url(%23chip)'/%3E%3Cpath%20d='M%2048%2020%20A%2028%2028%200%201%200%2048%2076%20A%2028%2028%200%201%200%2048%2020%20Z%20M%2048%2034%20A%2014%2014%200%201%201%2048%2062%20A%2014%2014%200%201%201%2048%2034%20Z'%20fill='%23ffffff'%20fill-rule='evenodd'/%3E%3Cpath%20d='M%2060%2062%20Q%2072%2068%2079%2084'%20fill='none'%20stroke='%23ffe06a'%20stroke-width='12'%20stroke-linecap='round'/%3E%3C/svg%3E"
    width="64"
    height="64"
    alt="QuickSpin logo"
    style="vertical-align: middle; margin-right: 16px"
  />
  <span style="font-size: 2.4rem; font-weight: 800; letter-spacing: -0.02em; vertical-align: middle">QuickSpin</span>
</p>

<p align="center">Turn AI wait time into play time — an embeddable wait-game SDK for any AI app.</p>

<p align="center">Built for the <b>Commonsmade "Make Waiting for AI Fun" build challenge</b>.</p>

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

## Pricing (real Stripe, or an honest preview)

The pricing section lists **only features that exist today**; anything planned is labeled
"after the hackathon". The widget itself never shows pricing — checkout lives on the host's page.

Two ways a host charges:

- **Live (generates real revenue):** pass a Stripe Payment Link per paid plan. Selecting the plan
  opens Stripe, the charge lands in your dashboard, and revenue counts toward the Vault's
  80%-of-revenue structure. QuickSpin never claims a payment it can't verify — Stripe is the
  source of truth.

  ```ts
  const checkout = createCheckoutFlow(confirmResult, {
    paymentLinks: { pro: "https://buy.stripe.com/…" }, // real charge
  });
  checkout.open();
  ```

- **Preview (no charge):** if you only pass the callback, the flow renders the confirmed-result
  preview and never fabricates a payment.

```ts
const checkout = createCheckoutFlow(async (planId) => {
  const res = await stripe.checkout({ priceId: priceFor(planId) });
  return { ok: res.succeeded, paymentId: res.id };
});
checkout.open();
```

The demo does both: with `VITE_STRIPE_PRO_LINK` set (see `.env.example`), "Choose Pro" opens a
real Stripe Payment Link; unset, it shows the labeled preview and no payment is possible.

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
│   │   ├── paywall.ts          # honest plans + Stripe Payment Link checkout
│   │   ├── styles.ts           # shadow-DOM widget CSS (CSS-variable themes)
│   │   └── types.ts            # contracts
│   ├── react/QuickSpinWidget.tsx  # React wrapper (quickspin/react)
│   ├── test/setup.ts           # vitest localStorage shim
│   ├── demo/hero.ts            # animated "spinner → play" hero story
│   └── demo/                   # landing + revenue thesis + before/after demo
├── .env.example                # VITE_STRIPE_PRO_LINK for the live checkout
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
