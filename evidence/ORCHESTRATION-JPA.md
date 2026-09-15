# QuickSpin — Orchestration & Judge Performance Assurance

This file prevents two different claims from being conflated:

1. **the product/build is verified**, and
2. **every upstream orchestration stage has repo-local proof**.

Where repo-local proof is absent, the status remains `UNKNOWN_IN_REPO` rather than being retroactively promoted to PASS.

## A. Faadil Agent System orchestration route

Canonical route:

`HOI → CHIEF OF STAFF → PROJECT AUTHORIZATION → PBPD → PROJECT FINISHER → HUMAN SUBMIT → POST-MORTEM`

| Stage | Required authority / artifact | QuickSpin status | Evidence boundary |
| --- | --- | --- | --- |
| HOI | opportunity discovery, normalization, rules/eligibility, winning intelligence | `UNKNOWN_IN_REPO / LEGACY_IMPORT` | QuickSpin repo does not preserve a canonical HOI packet; do not claim an HOI pass from repo evidence alone. |
| Chief of Staff | portfolio/capacity/prioritization decision | `UNKNOWN_IN_REPO / LEGACY_IMPORT` | No repo-local Chief-of-Staff decision artifact is preserved. |
| Project authorization | explicit authority to build | `VERIFIED_EXTERNAL_CONTEXT_NOT_REPO_LOCAL` | Build authorization came from the human project workflow; repo-local proof is not fabricated. |
| PBPD | requirements/evidence/build reconciliation | `ACTIVE / PASS_WITH_CONDITIONS` | `RECONCILIATION.md`, Activity Trace, Claim/Failure Ledgers, tests/builds. |
| Project Finisher | final QC, claim↔evidence challenge, runtime/video/submission lock | `ACTIVE` | `HACKATHON-HANDOFF.yaml`, `CYCLE-GATE-MATRIX.md`, submission package. |
| Human Submit | actual challenge form/save/submit | `PENDING_HUMAN_ACTION` | No submission is claimed before human submission evidence exists. |
| Post-mortem | result + learning + system update | `PENDING_AFTER_SUBMISSION` | Must happen after submission/result, not before. |

**Invariant:** missing upstream repo evidence is not silently converted into PASS. The current build can still be a valid build candidate, but its orchestration provenance remains explicitly bounded.

## B. Judge Performance Assurance V3.1 gates

### Judge Coverage

Every material criterion must map to:

`criterion → behavior → evidence → demo moment → pitch line → repo artifact → submission section → risk → coverage`

| Criterion | Behavior | Evidence | Demo moment | Pitch line | Repo artifact | Submission section | Main risk | Coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Waiting experience | thresholded optional play; collapse/resume; signed Wait Receipt | widget/persistence tests | same 12s control vs QuickSpin + receipt | “Same wait; better interaction; measured honestly.” | `src/sdk/widget.ts`, tests | Waiting experience | overclaim perceived-wait improvement | PASS |
| Originality | execution events become gameplay rather than decorative status | Runner/Orbit signal tests | collect/catch execution signal | “Observable execution becomes play.” | signal mechanics/tests | Originality | looks like a generic minigame overlay | PASS |
| AI-native fit | real phase/progress/signal/completion/failure contract | typed SDK + signal provenance | phase intensity + evidence-bearing signal | “The host drives play from what it actually observes.” | `types.ts`, `widget.ts` | AI-native fit | host could lie / fake progress | PASS_WITH_EXPLICIT_TRUST_BOUNDARY |
| Repeatability | vanilla + React + ESM/CJS/IIFE, interchangeable games | SDK builds | code sample + Runner/Orbit | “The product is the waiting runtime, not one game.” | build artifacts/README | Repeatability | demo mistaken for one-off experience | PASS |
| Execution quality | state machine, failure persistence, accessibility, CI/security | 33 tests, Node 22/24, CodeQL, audit 0 | compact proof card/Q&A | “Failure remains failure; unknown remains unknown.” | CI/security/evidence | Execution | plumbing dominates story | PASS |

### Critical-Path Assurance

The following path is release-critical and must remain independently demonstrable:

`request starts → wait threshold → waiting/play state → phase/signal → response OR failure → receipt/failure evidence → handoff`

Critical counter-paths:

- fast request finishes before threshold → **no UI flash**;
- host lacks trustworthy progress → **indeterminate progress**;
- signal lacks provenance → **UNKNOWN / INSUFFICIENT_EVIDENCE / no gameplay mutation**;
- request rejects → **failed outcome / no fabricated response**;
- user minimizes/hides → request lifecycle remains independent;
- public deployment has no returned URL → **no live-runtime claim**.

Status: `PASS_WITH_RUNTIME_RENDER_PROOF_PENDING`.

### Technical Ownership

QuickSpin must be explainable at implementation level without hand-waving:

- lifecycle/state transitions;
- `delayMs` threshold;
- phase-derived intensity when progress is unknown;
- execution signal provenance contract;
- Runner/Orbit signal mechanics;
- signed perceived-wait calculation;
- failure/cancel/completion persistence semantics;
- build/package boundary and security rationale.

Status: `PASS_WITH_REHEARSAL_PENDING`.

### Session Continuity

Canonical state must survive conversation/context handoffs without reconstructing truth from memory.

Required surfaces:

- `state/CANONICAL-STATE.yaml`;
- `state/HANDOVER.yaml`;
- `HACKATHON-STATE.yaml`;
- `HACKATHON-HANDOFF.yaml`;
- `.pbpd/state/ACTIVITY-TRACE.yaml`;
- Claim Ledger + Failure Ledger + Gate Matrix.

Status: `PASS`.

## C. Claim classification discipline

Material claims must be classified as one of:

- `DETERMINISTIC` — exact behavior controlled by code/test harness;
- `CONSTRAINED` — true only inside an explicit scope/boundary;
- `PROBABILISTIC` — outcome can vary and may not be promised;
- `HUMAN_REVIEWED` — dependent on reviewer/user judgment;
- `HYBRID` — combines deterministic mechanism with human/probabilistic outcome;
- `UNKNOWN` — evidence insufficient; no promotion allowed.

QuickSpin examples:

| Claim | Class | Current truth |
| --- | --- | --- |
| controlled happy path lasts 12 seconds | DETERMINISTIC | VERIFIED |
| missing signal provenance is rejected | DETERMINISTIC | VERIFIED |
| rejected Promise persists as failed | DETERMINISTIC | VERIFIED |
| every user feels the wait is shorter | PROBABILISTIC | REFUSED AS UNIVERSAL CLAIM |
| OpenAI June 2–3 incident proves provider latency/failure occurs | CONSTRAINED | VERIFIED PRIMARY-SOURCE REALITY ANCHOR |
| QuickSpin prevents provider incidents | UNKNOWN / OUTSIDE MECHANISM | REFUSED |
| visual treatment is jury-ready | HUMAN_REVIEWED | PENDING FINAL RUNTIME INSPECTION |
| public judge runtime is live | DETERMINISTIC EXTERNAL FACT | UNKNOWN/PENDING UNTIL RETURNED URL IS FETCHED |

## D. Canonical demo narrative gate

The final demo must preserve this sequence even if individual shots are compressed:

`PROBLEM → PAIN → TRIGGER → LIVE WORKFLOW → WOW → CONSEQUENCE → ACTION → TECHNICAL PROOF → IMPACT → CLOSE`

QuickSpin mapping:

1. **Problem** — passive AI waiting is a product state with weak agency/truth.
2. **Pain** — real provider latency/rejection exists; long/uncertain waits disrupt attention.
3. **Trigger** — start the same controlled 12-second request.
4. **Live Workflow** — phases/signals drive QuickSpin while the request remains unresolved.
5. **Wow** — execution signal becomes gameplay instead of decorative status.
6. **Consequence** — response produces a signed Wait Receipt; failure remains failure.
7. **Action** — host integrates a reusable waiting runtime via SDK contract.
8. **Technical Proof** — evidenceRef, UNKNOWN refusal, tests/build/security evidence.
9. **Impact** — waiting becomes interactive/measurable without claiming lower provider latency.
10. **Close** — “Turn live AI execution into play time — then get a receipt for what actually happened.”

**Video acceptance rule:** value/problem must land before technology; live/controlled proof must carry the story; no scene exists only as decoration.

## E. Promotion rules

QuickSpin may not promote to `SUBMISSION_READY` or `PROJECT_COMPLETE` merely because code is green.

Before `SUBMISSION_READY`:

1. official/rubric coverage is mapped;
2. critical-path positive + negative + UNKNOWN paths are demonstrated;
3. public runtime is actually returned and externally exercised;
4. final visual desktop/mobile/reduced-motion inspection passes;
5. demo/video proof sequence is captured;
6. Q&A is rehearsed against Claim Ledger;
7. repo/runtime/video/submission copy all describe the same product truth;
8. Project Finisher completes final Claim↔Evidence challenge.

Then: `HUMAN SUBMIT`.

After submission/result: `POST-MORTEM → LEARNING → SYSTEM UPDATE`.
