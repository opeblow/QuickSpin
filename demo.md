# QuickSpin — Judge Demo Recording Script

Target: **2:40–2:55**. Product proof first; pricing last.

## 0:00 — PAIN + real-world negative event

> “AI wait is not theoretical. On June 2, 2026, OpenAI documented elevated latency and errors
> across Responses API, Codex, and ChatGPT; some Responses API requests took longer than normal
> to begin generating. HCI research also shows system-imposed waits can increase frustration and
> ambiguity. QuickSpin treats waiting as a product state that must remain honest.”

Do not imply QuickSpin prevents provider outages. The claim is narrower: it makes latency states
interactive, observable, measurable, and honest when completion is uncertain.

## 0:18 — Same 12-second wait: control

Run **Classic spinner**.

> “Exactly twelve seconds. The percentage here belongs only to the controlled demo. A real host
> should never invent progress it cannot prove.”

## 0:42 — Same wait: QuickSpin happy path

Switch to **With QuickSpin**, run again, choose **Play while you wait**, and collect at least one
execution-signal token.

> “Same twelve seconds. Real phase changes drive pace. Observed tool, retrieval, and artifact
> events carry evidence references and become gameplay. No observed event means no token.”

## 1:18 — EVIDENCE: Wait Receipt

Answer the perceived-wait question and show **WAIT RECEIPT**.

> “Actual wait, actual played time, engagement, and felt wait. The result is signed: shorter,
> same, or longer. QuickSpin never forces a positive metric.”

## 1:43 — NEGATIVE PATH: real failure > fake success

Click **Run negative-path proof**. The harness executes a real rejected Promise with the controlled
error `DEMO_PROVIDER_TIMEOUT`.

Expected visible evidence:

1. a `warning` signal appears only after the Promise actually rejects;
2. the SDK emits a structured `fail` event with a persisted evidence id;
3. the widget says **Request failed — no response fabricated**;
4. no AI answer bubble appears;
5. local session evidence keeps `outcome: failed`.

> “This failure is intentionally induced, but the failure itself is real runtime behavior. We do
> not replace it with a success toast or canned answer.”

## 2:03 — UNKNOWN / abstention proof

Point to the SDK docs or event contract.

> “Execution signals require a host-owned evidence reference. If the signal is incomplete,
> QuickSpin returns no gameplay mutation and emits `signal-rejected: UNKNOWN /
INSUFFICIENT_EVIDENCE`. No evidence, no claim.”

## 2:22 — DIFFERENTIATOR + repeatability

> “This is not just a minigame overlay: the wait state is coupled to observable execution, the
> outcome is persisted, and both positive and negative paths remain auditable. Runner and Orbit
> share the same host contract; keyboard/pointer and reduced-motion support are built in.”

## 2:40 — Close / business model

> “The current SDK is honestly open. Team Pilot is integration support, not a fake paywall.
> QuickSpin: make AI waiting playable, keep failure truthful, and prove what happened.”

## Q&A fallback proof

If a judge asks whether the negative path is cosmetic, rerun it and keep the event log visible.
The evidence id must change per failed session, while the outcome remains `failed`.

## Guardrails

- Never call controlled demo phases/signals live production AI.
- Never call the controlled Promise rejection a real provider outage.
- Never claim QuickSpin prevents provider latency/errors; it changes the waiting experience and
  preserves outcome truth.
- Never claim every user experiences a shorter wait; show the signed receipt.
- Never claim npm availability until published.
- If Stripe is not configured, say “checkout preview,” not “payment.”
