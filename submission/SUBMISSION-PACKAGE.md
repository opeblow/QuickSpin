# QuickSpin — Submission Package

Status: **COPY / CLAIMS LOCKED — RUNTIME + VIDEO LINKS PENDING**

Challenge: Commonsmade — **Make Waiting for AI Fun**

## Project name

**QuickSpin**

## Tagline

**Turn live AI execution into play time — then get a receipt for what actually happened.**

## One-sentence pitch

QuickSpin is an embeddable waiting runtime for AI apps that turns real host execution phases and observed events into optional gameplay, then measures the wait with a signed Wait Receipt while preserving completion, failure, cancellation, and UNKNOWN as distinct outcomes.

## Short description

AI apps increasingly spend noticeable time reasoning, retrieving, and calling tools. QuickSpin replaces passive waiting with a reusable playable layer driven by real host phases and evidence-bearing execution signals. When the request resolves, a Wait Receipt records actual wait, engaged play, and perceived wait. If the request fails, QuickSpin preserves the failure instead of fabricating success; unsupported execution signals are rejected as UNKNOWN.

## Why it fits the challenge

### Waiting experience

- fast replies under the default 650 ms threshold do not flash the game UI;
- longer waits can become optional play;
- users can minimize/restore the layer;
- the game ends when the actual request resolves/fails.

### Originality

The waiting state is not only themed. Observable execution can alter gameplay, while a post-wait receipt measures whether the experience actually felt shorter.

### AI-native fit

Hosts can supply real phase changes plus observed retrieval/tool/artifact/warning signals. Signals require provenance; unsupported claims become UNKNOWN rather than game content.

### Repeatability

The same lifecycle ships as vanilla SDK, React wrapper, ESM, CJS, and IIFE bundles. Runner and Orbit are interchangeable consumers of the same host contract.

### Execution

- 33 automated tests;
- Node 22/24 CI;
- CodeQL;
- full npm audit: 0 vulnerabilities;
- production npm audit: 0 vulnerabilities;
- package-boundary dry run confirms build/test tooling is not shipped;
- deterministic positive and negative demo paths;
- reduced-motion and keyboard paths.

## Reality anchor — canonical five-part pattern

### 1. Signal / opportunity

AI applications routinely impose non-zero waits while reasoning, retrieving, calling tools, and assembling outputs. A 2026 HCI experiment with 425 participants across 10-, 30-, and 60-second delays showed that wait feedback changes perceived wait, frustration, and ambiguity.

### 2. Concrete real negative event

On **June 2–3, 2026**, OpenAI officially documented elevated errors and latency affecting Responses API, Codex, and ChatGPT. Affected Responses API traffic took longer than normal before beginning to generate; Codex requests were incorrectly rejected with HTTP 429; ChatGPT login/authentication/conversation flows degraded.

QuickSpin does **not** claim to prevent or repair that provider incident. The event establishes that AI latency, rejection, and failed flows are real product states rather than hypothetical edge cases.

### 3. Observable impact

The incident produced increased response-start latency, unexpected request rejection, and failed/degraded user flows — exactly the class of states in which a waiting UI must remain truthful about uncertainty and outcome.

### 4. Design lesson

A waiting layer must not equate “still waiting” with “will succeed,” must not fabricate percent progress, must preserve failure/cancellation separately from completion, and must abstain when execution evidence is insufficient.

### 5. Response / mitigation

QuickSpin mitigates the waiting-experience/evidence-integrity problem through indeterminate progress, evidence-bearing execution signals, explicit failed/cancelled/completed outcomes, UNKNOWN/refusal behavior, a 650 ms anti-flash threshold, and a signed Wait Receipt. Provider reliability itself remains out of scope.

Evidence: `evidence/REALITY-ANCHOR.md`.

## Negative path / real failure > fake success

The demo's `Run negative-path proof` triggers an actual rejected Promise with controlled error `DEMO_PROVIDER_TIMEOUT`.

Expected behavior:

1. warning is emitted only after the rejection;
2. session persists `outcome: failed`;
3. structured failure evidence is emitted;
4. no AI answer bubble is fabricated;
5. failure remains in the local evidence record.

This is explicitly a controlled runtime failure, not a claim that a live provider failed during the recording.

Historical CI/deployment/orchestration failures are also retained in `evidence/FAILURE-LEDGER.md` after mitigation. They are not deleted to make the project appear greener.

## UNKNOWN / refusal

`session.signal(...)` requires an evidence-bearing host event. Missing/invalid provenance produces `signal-rejected → UNKNOWN / INSUFFICIENT_EVIDENCE` and no gameplay mutation.

Canonical rule: **no evidence → no claim → no gameplay effect**.

## Demo proof sequence

Use `submission/VIDEO-SHOT-LOCK.md` and `demo.md`.

Minimum visible proof:

- same 12-second classic wait;
- same 12-second QuickSpin wait;
- real phase-driven game intensity;
- at least one execution signal becomes a game event;
- signed Wait Receipt;
- actual rejected-Promise negative path;
- UNKNOWN/provenance rule;
- reusable SDK contract.

## Differentiation line

**QuickSpin is not trying to be the biggest AI waiting game. It is the reusable waiting layer that lets an AI product make real execution playable, preserve failure truth, and measure what the user experienced.**

## Technical integration snippet

```ts
const qs = createQuickSpin({ target: "#quickspin" });
const session = qs.start({ status: "Reasoning…" });

session.setProgress(); // indeterminate unless the host really knows progress
session.setPhase("Searching…");
session.signal({
  kind: "retrieval",
  label: "Retrieved 12 sources",
  evidenceRef: "run_123:retrieval_4",
});

try {
  const response = await modelRequest();
  session.complete();
  return response;
} catch (error) {
  session.fail(error);
  throw error;
}
```

## Locked links

- Repository: `https://github.com/Faadil1/quickspin`
- Public runtime: **PENDING — do not substitute the expected Pages hostname until a deployment returns and the URL is externally verified**
- Demo video: **PENDING CAPTURE / UPLOAD**
- Failure Ledger: repository `evidence/FAILURE-LEDGER.md`
- Reality Anchor: repository `evidence/REALITY-ANCHOR.md`
- Cycle/Gate Matrix: repository `evidence/CYCLE-GATE-MATRIX.md`

## Suggested final submission copy

### What we built

QuickSpin is a drop-in waiting runtime for AI apps. During a real request, host phases can drive game intensity and observed execution events can become playable signals. When the response resolves, QuickSpin stops the game and creates a Wait Receipt showing actual wait, engaged play time, and perceived wait.

### Why it matters

Long AI waits are no longer just loading states: agents reason, browse, retrieve, and call tools for seconds or minutes. QuickSpin gives that time an interaction model while remaining honest about uncertainty. It does not fake progress, does not turn failures into success, and refuses unsupported execution signals.

### What makes it different

The product is the reusable execution-to-play contract, not one minigame. Runner and Orbit share the same lifecycle; hosts can integrate through vanilla JavaScript or React; the receipt makes the waiting experience measurable rather than relying on a “felt faster” marketing claim.

### What we proved

We built deterministic before/after waits, evidence-bearing execution signals, explicit failed/cancelled/completed outcomes, an actual rejected-Promise negative path, UNKNOWN/refusal behavior, signed perceived-wait metrics, accessibility paths, and a release/CI/security evidence chain. We also ground the design in a primary-source real production latency/rejection incident while explicitly refusing to claim that QuickSpin repairs provider reliability.

## Forbidden submission claims

Do not claim:

- QuickSpin reduces model/provider latency;
- every user perceives a shorter wait;
- controlled demo phases are live production AI;
- the induced negative-path failure is a live provider outage;
- QuickSpin would have prevented the cited OpenAI incident;
- npm publication before publication evidence exists;
- live Stripe payment when the demo is in checkout-preview mode;
- hosted analytics / extra game packs as current shipped features;
- a public runtime until the deployment has actually returned and been externally fetched;
- absolute security completeness;
- `PROJECT_COMPLETE` while final gates remain open.

## Final lock checklist

- [x] Rubric mapping
- [x] Canonical cycle `RUBRIC → PAIN → PROBLEM → DIFFERENTIATOR → EXECUTION → EVIDENCE → STORY → DEMO → Q&A`
- [x] Five-part reality anchor
- [x] Primary-source real negative event
- [x] Observable impact
- [x] Design implication + scoped mitigation
- [x] Differentiator
- [x] Positive execution path
- [x] Failure path
- [x] Real failure > fake success ledger
- [x] UNKNOWN / abstention
- [x] Claim ledger
- [x] Security gate
- [x] Cycle/Gateway anti-omission matrix
- [x] Video proof sequence locked
- [x] Q&A answer bank locked
- [x] Submission copy locked
- [ ] Public runtime verified
- [ ] Rendered visual/mobile jury review
- [ ] Final video captured and uploaded
- [ ] Adversarial Q&A rehearsed live
- [ ] Final links tested from a logged-out/external context
- [ ] Terminal reconciliation / final QC rerun
- [ ] Final Commonsmade submission saved/submitted
