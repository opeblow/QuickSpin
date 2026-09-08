# Contributing to QuickSpin

Thanks for wanting to make waiting for AI fun.

## Ground rules

This is a hackathon prototype, but treat it like production code:

- **TypeScript strict mode, zero errors.** `npm run typecheck` must pass.
- **No new dependencies** unless they earn their place. This is a zero-runtime-dependency SDK
  (Canvas + DOM + `localStorage` only). If you need a lib, say why in the PR.
- **Games stay self-contained.** A game is a `GameDefinition` in `src/sdk/` implementing
  `create(host): GameInstance`. It gets a canvas, a `root` element, a `progress` getter, and a
  `finish(reason)` callback. It never owns its own loop — the widget's single RAF drives `tick`.
- **The engine never waits for the AI.** Fast loops (games, animations) must never block on the
  model call. The AI telemetry is _state_, not a dependency.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + format + tests + SDK build (must pass before PR)
npm run build        # demo production build
```

## What's a good contribution

- A new `GameDefinition` (`src/sdk/`) — easiest high-value contribution. Add it to `GAMES` in
  `src/sdk/widget.ts`.
- Theming/a11y polish in the widget chassis.
- A real payment backend behind the checkout preview (today success only ever renders when the
  host's `onCheckout` callback confirms it — the SDK never fabricates a result).
- Docs, tests, demos.

## PR workflow

1. Branch from `main`: `git checkout -b feat/your-thing`
2. Make focused changes with clear commits. No unrelated edits.
3. Run `npm run check` locally — it must pass.
4. Open the PR. Use the `Pull Request Template` if present.
5. Keep PRs reviewable. If a reviewer asks for changes, iterate on the same branch.

## Commit conventions

- Imperative mood, concise: `Add orbit game`, `Fix perceived-wait streak`, `Doc: integrate with real APIs`.
- One logical change per commit.

## Reporting bugs

Open an issue with:

- What you did
- What happened vs. what you expected
- Browser/OS + console errors
- A minimal repro if possible

## Code of conduct

All contributions are subject to our [Code of Conduct](CODE_OF_CONDUCT.md). Be kind, be specific,
assume good intent.
