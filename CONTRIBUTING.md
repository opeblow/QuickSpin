# Contributing to QuickSpin

Thanks for wanting to make waiting for AI fun.

## Ground rules

This is a hackathon prototype, but treat it like production code:

- **TypeScript strict mode, zero errors.** `npm run typecheck` must pass.
- **No new dependencies** unless they earn their place. This is a zero-runtime-dependency SDK
  (Canvas + DOM + `localStorage` only). If you need a lib, say why in the PR.
- **Games stay self-contained.** A game is a `GameDefinition` in `src/sdk/` implementing
  `create(host): GameInstance`. It gets a canvas, a `progress` getter, a `status` getter, and a
  `finish(result)` callback. Nothing else.
- **The engine never waits for the AI.** Fast loops (games, animations) must never block on the
  model call. The AI telemetry is _state_, not a dependency.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # must pass before PR
npm run build        # full production build
```

## What's a good contribution

- A new `GameDefinition` (`src/sdk/`) — easiest high-value contribution. Add it to `GAMES` in
  `src/sdk/widget.ts`.
- Theming/a11y polish in the widget chassis.
- A real backend for the Vault revenue story (the checkout is simulated client-side today).
- Docs, tests, demos.

## PR workflow

1. Branch from `main`: `git checkout -b feat/your-thing`
2. Make focused changes with clear commits. No unrelated edits.
3. Run `npm run typecheck` and `npm run build` locally — both must pass.
4. Open the PR. Use the `Pull Request Template` if present.
5. Keep PRs reviewable. If a reviewer asks for changes, iterate on the same branch.

## Commit conventions

- Imperative mood, concise: `Add fish game`, `Fix streak off-by-one`, `Doc: integrate with real APIs`.
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
