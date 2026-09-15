# Failure Ledger — Real failure > fake success

Failures are retained as evidence. Fixing a failure does not delete the record that it occurred.

## F-01 — External production reality

- Event: OpenAI elevated latency/errors, June 2–3, 2026.
- Evidence: https://status.openai.com/incidents/01KT5XJ5ATD6RMYP908WS69FVD/write-up
- Verified observable impact: affected Responses API traffic took longer than normal to begin generating; Codex requests were incorrectly rejected with HTTP 429; ChatGPT login, authentication and conversation flows partially failed.
- Truth: production AI latency, rejection, and failed user flows are real states.
- Product implication: QuickSpin must preserve waiting, failure, cancellation, and UNKNOWN separately from success.
- Honesty boundary: QuickSpin does not claim it would have prevented the provider incident.

## F-02 — QuickSpin build failure preserved

- Event: GitHub Actions run `34925583311` failed.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34925583311
- Cause: deterministic day-streak tests mocked `Date.now()`, while implementation used `new Date()` and therefore read the runner wall clock.
- Fix: day-streak cursor now starts from `new Date(Date.now())`.
- Rule applied: the red run remains part of history; later green runs do not rewrite it as if it never happened.

## F-03 — Controlled runtime negative path

- Trigger: **Run negative-path proof** in the demo.
- Mechanism: an actual Promise rejects after 1.4 seconds with `DEMO_PROVIDER_TIMEOUT`.
- Expected evidence: `warning` → `fail`, persisted `outcome: failed`, failure code/message, no AI answer bubble.
- Honesty boundary: controlled test failure, not a claim of a live provider outage.

## UNKNOWN counter-case

Execution signals without a valid kind, non-empty label, and `evidenceRef` are rejected. The SDK emits `signal-rejected` with `UNKNOWN / INSUFFICIENT_EVIDENCE` and does not mutate game state.
This is the canonical abstention path: **no evidence → no gameplay claim**.

## F-04 — Judge-assurance gate rejected its own first pass

- Event: GitHub Actions run `34928143854` failed at TypeScript typecheck.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34928143854
- Cause: the newly added evidence test used `Array.prototype.at()`, but QuickSpin targets ES2020.
- Mitigation: the test now uses index access compatible with the actual target.
- Lesson: assurance code is subject to the same build truth as product code; a green narrative cannot override a red compiler.

## F-05 — Secure toolchain migration first pass failed

- Event: GitHub Actions run `34928931640` failed during `npm run typecheck`.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34928931640
- Cause: Vitest 5 tightened `vi.fn()` typing; the test helper passed an untyped generic mock where `WaitEventHandler` was required.
- Mitigation: the test now creates an explicitly typed `(event: WaitEvent) => void` mock.
- Lesson: dependency security upgrades must pass the actual compiler/test contract; a zero-vulnerability install alone is not sufficient evidence.

## F-06 — Vite 8 migration exposed a Rolldown TSX incompatibility

- Event: GitHub Actions run `34929036325` passed typecheck and all 33 Vitest 5 tests, then failed in the SDK library build.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34929036325
- Cause: Vite 8 switched the production bundler to Rolldown, which rejected the existing React TSX library entry without additional parser migration.
- Decision: use the supported Vite 7.3 security line, retaining the proven Rollup build path while closing the advisories.
- Lesson: latest-major adoption is not itself a quality gate; choose the smallest supported change that removes verified risk.

## F-07 — Security gate passed but workflow mutation push was refused

- Event: GitHub Actions run `34929187191` passed build, 33 tests, judge verification, full audit, production audit, and package-boundary checks, then failed only while pushing the commit.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34929187191
- Cause: the Actions token was not permitted to update `.github/workflows/ci.yml` without GitHub `workflows` permission.
- Mitigation: separate product/security changes from workflow-governance changes. The bot commits only package/test/evidence state; workflow updates are applied through the authorized GitHub connection.
- Lesson: evidence generation and repository governance are separate authority surfaces; passing evidence does not grant permission to mutate CI policy.

## F-08 — First public-runtime attempt stopped at Pages authority boundary

- Event: GitHub Actions run `34929705731` passed install, the full QuickSpin quality gate, all 33 tests, judge verification, and SDK build, then failed at `actions/configure-pages@v6`.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34929705731
- Exact failure: `Get Pages site failed ... repository has Pages enabled and configured to build using GitHub Actions ... Not Found`.
- Cause: GitHub Pages is not enabled/configured for this repository; the workflow token cannot turn an absent Pages site into runtime evidence.
- Impact: demo build remains valid, but no public `page_url` exists yet and `PUBLIC_DEPLOYMENT_PROOF` stays open.
- Mitigation: keep the reproducible Pages workflow, enable Pages from repository administration, rerun the workflow, then externally fetch the returned URL before promotion.
- Lesson: a deployment workflow, expected hostname, and successful static build are not equivalent to a live runtime. **No page URL → no live-demo claim.**

## F-09 — Temporary final-patch workflow became non-idempotent noise

- First valid run: `34930139522` succeeded and applied/validated the displayed SDK sample fix.
- Later examples: `34930293175` and `34930326398` failed after documentation-only pushes because the same one-shot patch workflow retriggered after its target text had already been changed.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34930139522 and subsequent `Final judge patch` runs on the branch.
- Cause: a migration/patch workflow was incorrectly configured as a persistent `push` workflow instead of a one-shot validation mechanism.
- Impact: red Actions history that does not represent a product regression, and avoidable ambiguity for reviewers.
- Mitigation: retain these runs here as orchestration evidence, then remove the temporary workflow. Permanent CI remains the authority for product correctness.
- Lesson: **one-shot migration machinery must be removed or made idempotent immediately after success. Real failure stays recorded; noisy automation does not stay active.**

## F-10 — Canonical verifier produced a formatting-sensitive false negative

- Event: PR #5 CI run `34958656629` passed dependency install, format, TypeScript typecheck, and all 33 tests, then failed at `npm run judge:verify`.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34958656629
- Exact failure: `evidence/RECONCILIATION.md missing required marker: Dependency security: CLOSED`.
- Cause: the verifier matched one exact presentation string while the canonical document represented the same fact as Markdown (`**Dependency security:** CLOSED`).
- Impact: correct canonical state was rejected because assurance logic depended on typography rather than semantic markers.
- Mitigation: validate stable semantic tokens (`Dependency security` and `CLOSED`) independently and keep cross-state assertions for stale-risk detection.
- Lesson: **assurance should be stricter about truth, not brittle about formatting. A false negative is still a real verifier failure and remains in the record.**

## F-11 — Future-classic production redeploy failed on restored cache state

- Event: first Vercel production redeploy of the multi-page future-classic build failed before checkout completed.
- Deployment id: `dpl_GScJ5TRx3YD9tbQTMBfanqyunstk`.
- Exact failure: `fatal: destination path 'source' already exists and is not an empty directory.`
- Cause: Vercel restored the previous build cache, including the bootstrap `source` directory, while the deployment script assumed a clean filesystem and ran `git clone ... source` directly.
- Impact: the new visual build did not reach production on the first attempt even though CI and CodeQL were already green.
- Mitigation: make the deployment bootstrap idempotent with `rm -rf source dist-demo` before cloning and rebuilding the exact canonical SHA.
- Recovery evidence: deployment `dpl_Gu77jod1hxSEPu8Sz9pRPAq3zbyL` checked out `27de7b3b4119b6499eda79effccadf262028de58`, completed `npm ci` with 0 vulnerabilities, passed TypeScript + Vite build, reached `READY`, and all five canonical routes returned HTTP 200.
- Lesson: **a green application build is not the same as an idempotent deployment pipeline. Build cache is state and must be handled explicitly.**

## F-12 — Judge verifier still pinned the pre-refactor production SHA

- Event: PR #10 CI run `34979638351` passed install, formatting, TypeScript typecheck, and all **33 tests** on Node 24, then failed at `npm run judge:verify`.
- Evidence: https://github.com/Faadil1/quickspin/actions/runs/34979638351
- Exact failure: `evidence/runtime/VERCEL-PRODUCTION-RUNTIME.md missing required marker: 83da2b807e2072bde30a76c72937c3cbe74ff389`.
- Cause: runtime evidence had correctly moved to future-classic source SHA `27de7b3b4119b6499eda79effccadf262028de58`, but the assurance script still hard-coded the older pre-refactor SHA.
- Impact: correct new runtime evidence was rejected because verifier provenance had not advanced with the canonical runtime.
- Mitigation: update `judge:verify` to require the new source SHA, the new READY deployment id, all-five-route HTTP-200 proof, the future-classic state marker, and explicitly fail if the old runtime SHA reappears.
- Lesson: **provenance locks must move atomically with canonical runtime promotion. A stale verifier is evidence drift, not a reason to weaken verification.**
