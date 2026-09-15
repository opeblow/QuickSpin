# QuickSpin — Video Shot Lock

Target: **2:35–2:55**. No scene exists only for decoration; every scene must close a rubric or evidence obligation.

## 0:00–0:10 — Hook / PAIN

Visual: hero timing frame, then the classic spinner state.

Voice:
> “AI apps increasingly spend real time reasoning, searching, and calling tools. QuickSpin turns that unavoidable wait into a playable state — without pretending the request has already succeeded.”

Proof obligation: waiting problem + honesty boundary.

## 0:10–0:30 — CONTROL

Visual: `Classic spinner`, exact 12-second deterministic run. It is acceptable to use a short speed-ramp in the edit only if the on-screen label still states the underlying controlled wait is exactly 12 seconds.

Voice:
> “This is our control: a deterministic twelve-second model wait.”

Proof obligation: same underlying duration for before/after comparison.

## 0:30–0:58 — QUICKSPIN / DIFFERENTIATOR

Visual: switch to `With QuickSpin`, run the same wait, start Runner, collect at least one execution token while phases change.

Voice:
> “Same twelve seconds. Real host phases change game intensity, and observed retrieval, tool, artifact, or warning events can become game events. No observed event means no token.”

Proof obligation: AI-native coupling, not a decorative minigame overlay.

## 0:58–1:18 — WAIT RECEIPT / EVIDENCE

Visual: response resolves, answer the perceived-wait prompt, hold on the Wait Receipt and evidence feed.

Voice:
> “When the response resolves, the game stops. The receipt keeps actual wait, played time, engagement, and felt wait. The metric is signed — it can say the wait felt longer.”

Proof obligation: measurable outcome + no forced success metric.

## 1:18–1:42 — NEGATIVE PATH

Visual: click `Run negative-path proof`. Keep the rejected Promise result, error state, and event/evidence id visible. Do not cut to a success screen.

Voice:
> “Now the counter-case. This controlled request actually rejects. QuickSpin records `failed`, keeps the evidence, and refuses to fabricate an AI answer.”

Proof obligation: **Real failure > fake success**.

## 1:42–1:56 — UNKNOWN / REFUSAL

Visual: briefly show the signal contract / event feed / docs line requiring `evidenceRef`.

Voice:
> “Execution signals need host-owned provenance. Insufficient evidence is rejected as UNKNOWN and does not change the game.”

Proof obligation: abstention / no-evidence-no-claim.

## 1:56–2:17 — REPEATABILITY / SDK

Visual: code sample with `evidenceRef`, then Runner + Orbit cards.

Voice:
> “QuickSpin is a reusable SDK, not one demo. Vanilla, React, ESM, CJS and IIFE builds share the same lifecycle. Fast responses below the default threshold never flash the game UI.”

Proof obligation: repeatability + execution quality.

## 2:17–2:36 — SECURITY / QUALITY / REALITY

Visual: compact proof card or repo checks: 33 tests, CI Node 22/24, CodeQL, npm audit 0. Do not linger on GitHub plumbing.

Voice:
> “The candidate passes 33 tests, current Node CI, CodeQL, and a zero-finding full and production npm audit. Failed build attempts remain in the evidence ledger instead of being erased.”

Proof obligation: execution + evidence discipline.

## 2:36–2:50 — CLOSE

Visual: QuickSpin hero + one-line thesis.

Voice:
> “QuickSpin turns live AI execution into playable wait time — then gives you a receipt proving what actually happened.”

Optional final line:
> “Open SDK. Honest outcomes. A waiting layer users can actually play.”

## Canonical narrative mapping

The edit must preserve this higher-level sequence even when scenes are compressed:

`PROBLEM → PAIN → TRIGGER → LIVE WORKFLOW → WOW → CONSEQUENCE → ACTION → TECHNICAL PROOF → IMPACT → CLOSE`

| Canonical beat | QuickSpin shot |
| --- | --- |
| PROBLEM | passive AI waiting is treated as a spinner rather than a truthful product state |
| PAIN | real latency/rejection exists; classic 12-second control makes the wait visible |
| TRIGGER | start the identical controlled request |
| LIVE WORKFLOW | host phases/signals drive Runner while request remains unresolved |
| WOW | an observed execution signal becomes an actual game event |
| CONSEQUENCE | response yields signed Wait Receipt; rejection yields failed outcome |
| ACTION | show the reusable SDK integration contract |
| TECHNICAL PROOF | evidenceRef, UNKNOWN refusal, CI/tests/CodeQL/security |
| IMPACT | waiting becomes interactive and measurable without claiming provider speedup |
| CLOSE | “Turn live AI execution into play time — then get a receipt for what actually happened.” |

Rules:

- **value before technology**;
- show **live/controlled proof**, not decorative slides pretending to be runtime;
- keep one narrative rather than a feature montage;
- reliability, failure, UNKNOWN, and fallback must be visible before rehearsal lock;
- do not move GitHub plumbing ahead of the user/product consequence.

## Capture gate

A take is not accepted unless it visibly contains:

- classic 12-second control;
- QuickSpin same-wait path;
- at least one execution signal becoming gameplay;
- Wait Receipt;
- failed negative path with no fabricated answer;
- UNKNOWN/provenance rule;
- final repo/runtime identity.

Do not claim the controlled 12-second run is live production AI. Do not claim the induced failure is a live provider outage. Do not claim universal perceived-wait reduction.
