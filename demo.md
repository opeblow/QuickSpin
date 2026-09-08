# QuickSpin — Demo Recording Script

Use this script to record the demo for the Commonsmade "Make Waiting for AI Fun" challenge.
`npm run dev` runs the whole thing locally in the browser; nothing else needs installing.

- **Target length: 2:45** (hard floor 2:15, hard ceiling 3:00).
- Record at 1080p, a maximized browser window, and no other tabs visible.
- Every timestamp below is a planned cut; if you run long, trim the bullets that start with "(optional)".

---

## Prep (before you press record)

1. `npm run dev` → open http://localhost:5173
2. Window at least 1280px wide, browser zoom at 100%, clean bookmarks bar.
3. Under **Pricing**, make sure Pro shows "Choose Pro — checkout preview". If it shows
   "pay with Stripe" instead, either (a) keep it — you have the env var set and want to show a
   real checkout, or (b) run without the env var to keep the video on the preview.
4. Leave the mouse still on the **Run demo generation** button, ready to click.
5. Practice the demo once end-to-end (both modes) so the pacing is smooth.
6. Silence notifications. If you speak live, use a close-ish mic; otherwise record silent and add
   captions in your editor.

---

## The script

### 0:00 — Intro / the hero (15s)

Show the landing page hero. Let the animated story run for one loop.
_On screen:_ the "spinner → play" animation under "Turn AI wait time into **play time**."

> "Every AI app has a weakest moment: the seconds that vanish on a “thinking…” spinner. That’s
> where users leave — and where the answer you already paid for lands on nobody’s screen.
> QuickSpin replaces that dead wait with a playable game, and turns the gap into the moment your
> users actually stay."

### 0:15 — Set up the comparison (15s)

_On screen:_ the demo section labeled "HOST APP — a one-message AI client", the Classic/QuickSpin
toggle, and the user bubble "Where should five friends eat tonight in Austin?"

> "This is a one-message AI client — nothing special. Same model wait, two different waiting
> experiences. Let’s show you the one you already have first."

### 0:30 — Before: the classic spinner (20s)

_Click:_ **Classic spinner** → **Run demo generation**.
_On screen:_ a plain spinner ticks through Reasoning → Searching the web → Drafting → Polishing
at 0% → 100%, then the answer bubble appears.

> "There it is — a dead spinner for twelve seconds. Nothing at stake, nothing to lose, so the
> natural move is to tab away. And when you do, the response — the whole point of the call — is
> already missed."

### 0:50 — After: with QuickSpin (40s)

_Click:_ **With QuickSpin** → **Run demo generation**.
_On screen:_ the widget mounts a game (Wait Runner). Play it while the phases tick
("Reasoning… → Drafting… → Polishing…"). When it finishes, the answer lands as a bubble, then
the widget asks **"That took 12s. How long did it feel?"**.

> "Same wait, same twelve seconds — but now it’s a game. You’re jumping, you’ve got a real score
> and a streak you don’t want to lose — so when the eleven-second mark comes, you’re still here.
> The response lands… and you’re actually looking at it. QuickSpin even asks how the wait felt —
> real perceived-wait data for the host, straight from the player."

### 1:30 — Depth: another game, theming (30s)

_Click:_ the in-widget **game chooser** (the overlay at the start of a new run), pick **Orbit Catch**,
play a few catches. Then `setTheme` isn’t visible in the demo UI, so instead make the point with what
is visible.

> "Two games ship today — Wait Runner and Orbit Catch — and droppable game packs come later.
> Every game is keyboard- and tap-friendly, dark and light themed, and the whole widget lives in
> its own shadow DOM, so your page’s styles can’t leak in. Drop-in means exactly that."

### 2:00 — Why hosts pay / monetization (40s)

_Scroll slowly_ from the stats band ("AI wait turned into play", streaks, best scores) through
**"The wait is an abandoned checkout"** comparison table and the three "How hosts make money"
steps, ending at **Pricing**.
_Click:_ **Choose Pro — checkout preview** (the modal with the red "Checkout preview" tag).
If you have a real Stripe link configured, do NOT type card details — narrate the redirect instead.

> "Here’s the business case. The classic spinner can’t be measured and churns users. QuickSpin
> gives you engagement, repeat visits from the streak, and — because only real features are
> listed — a Pro plan that’s honest. Checkout is wired to actual Stripe checkout: set one
> environment variable and ‘Choose Pro’ opens a real payment link. No platform tax, no fake
> payment page. And the SDK never claims a payment it can’t verify — Stripe is the source of truth."

### 2:40 — Integrate, and land it (20s)

_Scroll to the SDK code block._ Point at `createQuickSpin`, `session.setPhase`, and
`session.complete()` with the mouse cursor.

> "Integration is one `<div>` and a few lines — `npm install quickspin`, mount the widget, feed it
> your model’s phases, and call `session.complete()` when the response is ready. There’s a React
> wrapper too. QuickSpin: turn the weakest moment in every AI app into play time, revenue, and a
> reason to come back."

**End screen:** held on the hero for 3 seconds.

---

## Guardrails (keep the video credible)

- Only claim what the demo actually shows. Never say "used by thousands" or invent metrics.
- Say "the wait is simulated locally" only if you mention the demo setup; the landing already says it.
- If the Stripe env var is set and a plan says "pay with Stripe", either show the redirect
  (without completing a charge) or edit the pricing section copy in `.env` before recording.
- Do not read this document on screen; the mouse should feel deliberate, the cuts smooth.

## After recording

- Trim the start/end, add captions if you spoke off-mic, and export a shareable link
  (unlisted YouTube, Loom, or a raw mp4).
- Add the URL to the README so judges can watch without running the code.
