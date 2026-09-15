# Canonical Cycle & Gate Matrix — QuickSpin

This is the anti-omission control surface for the hackathon build. It combines the narrative/product cycle with cross-cutting quality gates and the terminal promotion sequence.

## A. Core judge/product cycle

`RUBRIC → PAIN → PROBLEM → DIFFERENTIATOR → EXECUTION → EVIDENCE → STORY → DEMO → Q&A`

| Stage | Required proof | QuickSpin status | Canonical evidence |
| --- | --- | --- | --- |
| RUBRIC | challenge-native fit and judge dimensions mapped | PASS | `RUBRIC-TRACEABILITY.md` |
| PAIN | real user/system pain, not invented | PASS | `REALITY-ANCHOR.md` |
| PROBLEM | precise failure of current waiting experience | PASS | Reality Anchor + demo before/after |
| DIFFERENTIATOR | product-specific mechanism, not cosmetic novelty | PASS | execution signals + Wait Receipt |
| EXECUTION | working SDK/runtime and lifecycle | PASS | source, tests, builds |
| EVIDENCE | claims tied to primary/first-party/runtime evidence | PASS_WITH_LIMITATIONS | Claim/Failure ledgers, CI, security evidence |
| STORY | judge narrative compresses pain → mechanism → proof | PASS | `demo.md`, submission draft |
| DEMO | material claims are demonstrable | PASS_PENDING_CAPTURE_AND_PUBLIC_RUNTIME | happy path, receipt, failure, UNKNOWN |
| Q&A | adversarial objections answered without invention | PREPARED_PENDING_LIVE_REHEARSAL | `JUDGE-QA.md`, `Q&A-REHEARSAL.md` |

## B. Mandatory reality-anchor pattern

`SIGNAL / OPPORTUNITY → REAL NEGATIVE EVENT → OBSERVABLE IMPACT → DESIGN LESSON → RESPONSE / MITIGATION`

All five are **PASS** in `REALITY-ANCHOR.md`, with mitigation explicitly scoped to waiting experience/evidence integrity rather than provider reliability.

## C. Failure-truth gates

| Gate | Pass condition | Status |
| --- | --- | --- |
| REAL_FAILURE_GT_FAKE_SUCCESS | failures remain in evidence after repair | PASS |
| REAL_EXTERNAL_NEGATIVE_EVENT | at least one primary-source real event | PASS — OpenAI June 2–3, 2026 |
| RUNTIME_NEGATIVE_PATH | actual failure terminates as failure, not completion | PASS |
| UNKNOWN_ABSTENTION | insufficient provenance produces UNKNOWN/refusal | PASS |
| NO_FAKE_PROGRESS | unknown progress stays indeterminate | PASS |
| NO_FAKE_RESPONSE | failed request path produces no fabricated AI answer | PASS |
| CLAIM_BOUNDARY | mitigation is not overstated as provider repair | PASS |

## D. Cross-cutting build gates

| Gate | Why it exists | Status |
| --- | --- | --- |
| ELIGIBILITY / RULE FIT | avoid building something ineligible | PASS_WITH_CURRENT_RUBRIC_EVIDENCE |
| SCOPE LOCK | prevent late scope explosion | PASS — final work is QC/package only |
| BUILD CORRECTNESS | typecheck/tests/build must pass | PASS |
| CODEQL | static security/quality scan | PASS |
| DEPENDENCY SECURITY | no unresolved npm audit findings in candidate | PASS_ZERO_NPM_AUDIT |
| SUPPLY-CHAIN INSTALL SCRIPTS | surface unreviewed dependency lifecycle scripts instead of silently trusting them | REVIEWED_WARNING_NONRUNTIME — npm 11 flags `esbuild@0.28.2`; build passes and package boundary excludes build tooling. See `security/SUPPLY-CHAIN-REVIEW.md`. |
| PACKAGE BOUNDARY | dev toolchain not leaked into published package surface | PASS |
| RELEASE REPRODUCIBILITY | release workflow builds SDK + demo artifacts | PASS |
| ACCESSIBILITY / INPUT PARITY | keyboard/pointer/focus support where required | PASS_WITH_IMPLEMENTATION_TEST_EVIDENCE |
| REDUCED MOTION | reduced-motion behavior exists | PASS_IN_IMPLEMENTATION_PENDING_RENDER_INSPECTION |
| FAST RESPONSE / ANTI-FLASH | game UI does not flash for short waits | PASS_IN_IMPLEMENTATION |
| STATE/LIFECYCLE INTEGRITY | waiting/playing/ready/completed/failed/cancelled are distinct | PASS |
| PERSISTENCE INTEGRITY | failed/completed metrics stay semantically correct | PASS |
| PERFORMANCE / BUNDLE SANITY | browser SDK remains lightweight and buildable | PASS_WITH_BUILD_ARTIFACT_EVIDENCE |
| LICENSE / IP / THIRD-PARTY CLAIMS | no unverified asset/license claim introduced | PASS_WITH_NO_NEW_EXTERNAL_ASSET_DEPENDENCY |
| ROLLBACK / RECOVERY | candidate can be abandoned without corrupting main | PASS — isolated branch model |
| COLLABORATOR HANDOFF | state/evidence makes continuation unambiguous | PASS_ACTIVE |

## E. Judge/runtime gates

| Gate | Pass condition | Status |
| --- | --- | --- |
| UX/UI LEGIBILITY | proof readable without narration | PASS_WITH_CONDITIONS |
| ANTI-AI-SLOP / DOMAIN-NATIVE VISUAL | visual language supports waiting/play/evidence thesis | PASS_WITH_CONDITIONS |
| PUBLIC RUNTIME | returned live URL fetched and exercised | **PENDING** — Pages enablement required |
| DESKTOP RUNTIME INSPECTION | core flow visually checked on final URL | PENDING |
| MOBILE RUNTIME INSPECTION | responsive/mobile proof checked on final URL | PENDING |
| HAPPY-PATH DEMO | exact 12s comparison + response handoff | PASS_PENDING_CAPTURE |
| WAIT RECEIPT DEMO | actual/played/engaged/felt shown | PASS_PENDING_CAPTURE |
| NEGATIVE-PATH DEMO | rejected Promise visibly becomes failed outcome | PASS_PENDING_CAPTURE |
| UNKNOWN DEMO / EXPLANATION | no evidence → no gameplay claim | PASS_IN_RUNTIME_CONTRACT; VIDEO_EXPLANATION_PENDING |
| VIDEO | final proof sequence captured and edited | PENDING |
| Q&A LIVE REHEARSAL | answers delivered against claim ledger without drift | PENDING |
| SUBMISSION PACKAGE | runtime/repo/video/copy/evidence links final | DRAFT_READY_PENDING_LINKS |

## F. Validation/evidence gates

| Gate | Pass condition | Status |
| --- | --- | --- |
| PRIMARY SOURCE CHECK | real-world negative event verified from authoritative source | PASS |
| CLAIM LEDGER | every material claim classified | PASS_WITH_OPEN_RUNTIME_UNKNOWN |
| FAILURE LEDGER | real failures retained after fixes | PASS |
| RUBRIC TRACEABILITY | every judging dimension points to proof | PASS |
| REQUIREMENT ↔ EVIDENCE | each MUST has evidence or explicit UNKNOWN | PASS_WITH_CONDITIONS |
| EVIDENCE ↔ ARTIFACT | cited proof corresponds to actual code/build/run | PASS_WITH_CONDITIONS |
| RISK ↔ STATE | open risks match current canonical state | PASS_AFTER_RECONCILIATION |
| BUILD ↔ STATE | state never claims greener than actual checks | PASS_AFTER_RECONCILIATION |
| USER VALIDATION | broader evidence that users prefer the wait experience | OPEN_NONBLOCKING; do not overclaim |

## G. Terminal promotion sequence

The product may not jump directly from “works” to `PROJECT_COMPLETE`.

`VERIFICATION-BEFORE-COMPLETION`
→ `REQUIREMENTS ↔ EVIDENCE ↔ ARTIFACTS ↔ RISKS ↔ PROJECT STATE ↔ ACTUAL BUILD`
→ `RUNTIME + VISUAL PROOF LOCK`
→ `DEMO + VIDEO + Q&A LOCK`
→ `SUBMISSION PACKAGE LOCK`
→ `BUILD READINESS`
→ `HANDOFF TO FINISHER`
→ `FINAL QC`
→ `PROJECT_COMPLETE`

Current terminal verdict: **BUILD_CANDIDATE_READY_WITH_LIMITATIONS**.

## H. Blocking items before PROJECT_COMPLETE

1. Enable GitHub Pages (or another final public runtime) and obtain a real returned URL.
2. Fetch/exercise that runtime and record public deployment proof.
3. Inspect desktop + mobile final rendering and close visual conditions.
4. Capture the final demo including Wait Receipt and negative-path proof.
5. Perform live Q&A rehearsal against the Claim Ledger.
6. Lock final submission URLs/assets/copy.
7. Re-run terminal reconciliation and final QC.

Broader user validation and stricter npm install-script policy remain useful but are **non-blocking** for hackathon submission; neither may be converted into a stronger claim than the evidence supports.

## I. Faadil Agent System + Judge Performance Assurance

Canonical orchestration route:

`HOI → CHIEF OF STAFF → PROJECT AUTHORIZATION → PBPD → PROJECT FINISHER → HUMAN SUBMIT → POST-MORTEM`

Repo-local truth is recorded in `ORCHESTRATION-JPA.md`. Historical HOI / Chief-of-Staff proof is not present in this repository and therefore remains `UNKNOWN_IN_REPO / LEGACY_IMPORT`; it is **not** retroactively promoted to PASS.

Mandatory Judge Performance Assurance gates:

| Gate | Status | Evidence |
| --- | --- | --- |
| JUDGE COVERAGE | PASS | criterion→behavior→evidence→demo→pitch→artifact→submission→risk mapping in `ORCHESTRATION-JPA.md` |
| CRITICAL-PATH ASSURANCE | PASS_WITH_RUNTIME_RENDER_PROOF_PENDING | positive + failure + UNKNOWN + anti-flash paths mapped |
| TECHNICAL OWNERSHIP | PASS_WITH_REHEARSAL_PENDING | implementation surfaces enumerated; live defense pending |
| SESSION CONTINUITY | PASS | state/handover/activity/claim/failure surfaces locked |
| CLAIM CLASSIFICATION | PASS | deterministic/constrained/probabilistic/human-reviewed/hybrid/unknown discipline |

Canonical final demo narrative:

`PROBLEM → PAIN → TRIGGER → LIVE WORKFLOW → WOW → CONSEQUENCE → ACTION → TECHNICAL PROOF → IMPACT → CLOSE`

The current video shot lock maps to this sequence. **Value before technology; proof before plumbing; one narrative; reliability/fallback before rehearsal.**

Promotion rule:

`PROJECT FINISHER → SUBMISSION_READY → HUMAN SUBMIT → POST-MORTEM → LEARNING / SYSTEM UPDATE`

`SUBMISSION_READY` is still blocked by the public-runtime, render-inspection, video, live-Q&A, and final-link gates above.
