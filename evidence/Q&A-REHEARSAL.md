# QuickSpin — Judge Q&A Rehearsal

Status: **ANSWER BANK LOCKED — LIVE REHEARSAL PENDING**

Answers are intentionally short enough to deliver in ~10–20 seconds before expanding into evidence.

## “Isn’t this just a minigame replacing a spinner?”

No. The game is bound to the request lifecycle. Host phases change intensity, observed execution events can become game objects, completion stops play, failure stays failure, and the Wait Receipt measures the waiting experience. A standalone minigame would not have those execution/evidence contracts.

Evidence: `src/sdk/widget.ts`, Runner/Orbit signal tests, Wait Receipt.

## “How is this AI-native?”

QuickSpin consumes states an AI host actually observes: phases, optional real progress, retrieval/tool/artifact/warning signals, completion, cancellation, and failure. It does not infer fake progress. Execution signals require a host-owned `evidenceRef`.

## “Give me one concrete real-world failure that justifies this build.”

On June 2–3, 2026, OpenAI officially reported elevated errors and latency across Responses API, Codex, and ChatGPT. Affected Responses API traffic took longer than normal to begin generating, Codex requests were incorrectly rejected with HTTP 429, and ChatGPT login/authentication/conversation flows degraded. QuickSpin does **not** claim it could prevent that provider incident; the design implication is that a waiting UI must not fake progress or assume success, and must preserve failure/UNKNOWN as first-class outcomes.

Primary evidence: `evidence/REALITY-ANCHOR.md` → OpenAI status incident write-up.

## “Can QuickSpin prove the host is telling the truth?”

No SDK can cryptographically prove an arbitrary host is honest. QuickSpin makes that trust boundary explicit: the host must provide provenance, and missing provenance is rejected as `UNKNOWN / INSUFFICIENT_EVIDENCE`. The SDK refuses to turn an unsupported claim into gameplay.

## “What happens when the AI request fails?”

Run the negative-path proof. An actual Promise rejects with the controlled error `DEMO_PROVIDER_TIMEOUT`. The session becomes `failed`, failure evidence is persisted/emitted, and no AI answer is fabricated.

## “Does QuickSpin make the model faster?”

No. It does not claim to reduce provider latency. It changes the waiting experience and makes that experience measurable and auditable.

## “Can you prove the wait feels shorter?”

Not universally. That is why the Wait Receipt is signed: users can report shorter, the same, or longer. The product provides measurement infrastructure rather than forcing a positive outcome.

## “Why show a game at all? Isn’t that distracting?”

It is optional and thresholded. Fast responses under the default 650 ms delay never flash the game. The user can dismiss/minimize it, and the request continues independently. QuickSpin targets waits long enough that passive waiting is already the dominant interaction.

## “Why not just show a better progress bar?”

A progress bar is appropriate only when the host knows meaningful progress. Many agent/model workflows do not. QuickSpin supports indeterminate progress and can use truthful phase changes without inventing a percentage.

## “Why is the classic demo showing percentages if you say not to fake them?”

That percentage is explicitly part of the controlled comparison harness, not a recommendation for production AI. The QuickSpin side deliberately stays indeterminate unless the host has real progress.

## “How reusable is this beyond your demo?”

The same lifecycle ships through vanilla mounting, React, ESM, CJS, and IIFE bundles. Hosts control phases/signals; Runner and Orbit are two consumers of the same contract. The product is the waiting runtime, not one game.

## “What is different from VibeQuest?”

VibeQuest is a strong single experience that visualizes an agent as a game. QuickSpin is positioned as an embeddable waiting layer: any host can connect its own execution phases/signals, choose a game, measure perceived wait, and preserve failure/UNKNOWN outcomes. Our wedge is repeatable integration + evidence, not a larger game world.

## “Why should this exist as an SDK rather than a feature inside one AI app?”

Waiting is a recurring interface state across AI products. The integration contract — start, phase, signal, complete/fail, receipt — is reusable across hosts, which makes it more valuable as infrastructure than as one app-specific effect.

## “What does the $9 Team Pilot buy if the SDK is open?”

Integration/service value: branded setup and priority support. The SDK capabilities shown in the demo remain honestly available in Free. Hosted analytics and extra packs are roadmap items, not falsely paywalled existing features.

## “Is Stripe actually live?”

Only if `VITE_STRIPE_PRO_LINK` is configured. Otherwise the UI explicitly says checkout preview. We do not call preview mode a payment.

## “Is the demo using live AI?”

No. The happy path is deterministic by design so the before/after comparison uses exactly the same twelve-second wait. Execution-signal behavior is real SDK behavior, but the demo phases are controlled host-supplied events.

## “Is your negative path a real provider outage?”

No. It is a real runtime Promise rejection induced in the controlled harness. The external June 2–3, 2026 OpenAI incident is separate primary-source evidence that latency/rejection/failure states occur in production; we do not conflate the two.

## “What failed while you built this?”

Several things, and they remain in `evidence/FAILURE-LEDGER.md`: a deterministic date test, the first judge-assurance typecheck, a Vitest 5 typing migration, Vite 8/Rolldown TSX incompatibility, workflow permission boundaries, the first Pages deployment attempt, and a non-idempotent one-shot patch workflow. Each failure has cause, mitigation, and an operational/design lesson.

## “What is still incomplete?”

The public runtime is blocked until GitHub Pages is enabled for the repo; the final rendered visual review, video capture, live Q&A rehearsal, and final link lock remain open. The project is therefore `BUILD_CANDIDATE_READY_WITH_LIMITATIONS`, not `PROJECT_COMPLETE`.

## Rehearsal gate

Before submission, rehearse at least these adversarial prompts without looking at this file:

1. “This is just a game overlay — prove me wrong.”
2. “Give me one real event that proves this problem exists.”
3. “Your host could lie about signals — why should I trust this?”
4. “Show me what happens when the AI fails.”
5. “Prove users think it is faster.”
6. “Why is this better as infrastructure than a polished one-off game?”
7. “What did you actually fail at during the build?”

PASS requires answers to preserve the claim boundaries above; improvisation may add context but may not upgrade UNKNOWN into VERIFIED.
