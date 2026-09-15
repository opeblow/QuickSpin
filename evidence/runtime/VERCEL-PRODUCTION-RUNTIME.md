# Verified Production Runtime — Vercel

Status: **PASS / PUBLIC_DEPLOYMENT_PROOF CLOSED**

## Canonical URL

https://quickspin-runtime.vercel.app

Verified routes:

- `/`
- `/lab`
- `/proof`
- `/sdk`
- `/judges`

All five routes returned **HTTP 200 OK** after deployment.

## Provenance

- Repository: `Faadil1/quickspin`
- Canonical source SHA: `27de7b3b4119b6499eda79effccadf262028de58`
- Vercel project: `quickspin-runtime`
- Vercel project id: `prj_7BesKgTL3aTrP6xVZUwIDQSmGQ50`
- Production deployment id: `dpl_Gu77jod1hxSEPu8Sz9pRPAq3zbyL`
- Production alias: `quickspin-runtime.vercel.app`

## Build evidence

Vercel build logs explicitly show:

1. cleanup of cached bootstrap folders before checkout;
2. `git clone https://github.com/Faadil1/quickspin.git source`;
3. checkout to exact detached HEAD `27de7b3b4119b6499eda79effccadf262028de58`;
4. `npm ci` completed with **0 vulnerabilities**;
5. `npm run build` passed TypeScript typecheck and Vite 7.3.6 production build;
6. output produced `dist-demo/index.html`, CSS and JS assets;
7. deployment completed and reached `READY`.

The npm 11 `esbuild@0.28.2` install-script warning remains classified separately as a reviewed supply-chain warning; it did not prevent the verified build and does not change the zero-audit result.

## Multi-page runtime proof

The deployed product now exposes five distinct judge/product surfaces rather than a single long landing page:

- **Home** — product thesis and memorable framing;
- **Lab** — live 12-second comparison + negative path;
- **Proof** — Wait Receipt, real-world reality anchor, failure and UNKNOWN evidence;
- **SDK** — integration contract, lifecycle and repeatability;
- **Judges** — rubric / cycle / evidence compression.

Vercel rewrites return the application shell for each direct route, and the client router renders the correct page from `window.location.pathname`.

## External fetch evidence

Post-deploy fetches returned **HTTP 200 OK** for all five canonical routes. The root HTML references the new production assets:

- CSS: `/assets/index-C8XKUdEe.css`
- JS: `/assets/index-BPf83v3k.js`

Document metadata now identifies the future-classic build:

- title: `QuickSpin — Play the wait. Keep the truth.`
- theme color: `#d5d6d0`
- description explicitly includes playable wait, failure truth, and signed Wait Receipt.

## Failed deployment retained

The first future-classic redeploy attempt failed because the restored Vercel build cache already contained a non-empty `source` directory and the bootstrap script attempted another `git clone` into it.

That failure is preserved in `evidence/FAILURE-LEDGER.md` as F-11. The mitigation was to make the bootstrap idempotent by removing `source` and `dist-demo` before cloning. The next deployment of the same canonical SHA passed.

## Boundary

This closes **PUBLIC_DEPLOYMENT_PROOF** for the future-classic multi-page build.

It does **not** by itself close final pixel-level desktop/mobile visual inspection, interaction-path recording, video capture, or live Q&A rehearsal.

Canonical rule retained: expected hostname ≠ runtime evidence; this URL is promoted only because Vercel returned a READY deployment and all canonical public routes returned HTTP 200.
