import { existsSync, readFileSync } from "node:fs";

const required = {
  "evidence/REALITY-ANCHOR.md": [
    "Signal positif / opportunité",
    "Événement négatif concret, réel et vérifiable",
    "Impact observable",
    "Leçon / implication design",
    "Réponse / mitigation QuickSpin",
    "June 2–3, 2026",
    "REAL FAILURE > FAKE SUCCESS",
  ],
  "evidence/FAILURE-LEDGER.md": [
    "Real failure > fake success",
    "DEMO_PROVIDER_TIMEOUT",
    "UNKNOWN counter-case",
    "F-08",
    "F-09",
    "F-10",
    "F-11",
    "F-12",
  ],
  "evidence/JUDGE-CYCLE.md": [
    "RUBRIC",
    "PAIN",
    "PROBLEM",
    "DIFFERENTIATOR",
    "EXECUTION",
    "EVIDENCE",
    "STORY",
    "DEMO",
    "Q&A",
  ],
  "evidence/CYCLE-GATE-MATRIX.md": [
    "Core judge/product cycle",
    "Mandatory reality-anchor pattern",
    "Failure-truth gates",
    "Cross-cutting build gates",
    "Terminal promotion sequence",
    "Faadil Agent System + Judge Performance Assurance",
    "HOI → CHIEF OF STAFF → PROJECT AUTHORIZATION → PBPD → PROJECT FINISHER → HUMAN SUBMIT → POST-MORTEM",
    "JUDGE COVERAGE",
    "CRITICAL-PATH ASSURANCE",
    "TECHNICAL OWNERSHIP",
    "SESSION CONTINUITY",
  ],
  "evidence/ORCHESTRATION-JPA.md": [
    "HOI → CHIEF OF STAFF → PROJECT AUTHORIZATION → PBPD → PROJECT FINISHER → HUMAN SUBMIT → POST-MORTEM",
    "UNKNOWN_IN_REPO / LEGACY_IMPORT",
    "Judge Coverage",
    "Critical-Path Assurance",
    "Technical Ownership",
    "Session Continuity",
    "DETERMINISTIC",
    "PROBLEM → PAIN → TRIGGER → LIVE WORKFLOW → WOW → CONSEQUENCE → ACTION → TECHNICAL PROOF → IMPACT → CLOSE",
  ],
  "evidence/RUBRIC-TRACEABILITY.md": ["AI-native fit", "Evidence honesty"],
  "evidence/RECONCILIATION.md": [
    "verification-before-completion",
    "BUILD_CANDIDATE_READY_WITH_LIMITATIONS",
    "Dependency security",
    "CLOSED",
    "Public deployment proof",
  ],
  "evidence/GATE-REPORT.md": [
    "REAL NEGATIVE EVENT",
    "UNKNOWN / ABSTENTION",
    "PASS_VERIFIED_PUBLIC_RUNTIME",
    "PROJECT_COMPLETE",
  ],
  "evidence/JUDGE-QA.md": ["What happens if the AI request fails?"],
  "evidence/Q&A-REHEARSAL.md": ["Give me one concrete real-world failure", "QuickSpin"],
  "evidence/CLAIM-LEDGER.md": [
    "REFUSED",
    "UNKNOWN / NOT_CLAIMED",
    "dependency-security gate is closed",
    "public judge runtime is live",
    "VERIFIED",
  ],
  "evidence/runtime/VERCEL-PRODUCTION-RUNTIME.md": [
    "PASS / PUBLIC_DEPLOYMENT_PROOF CLOSED",
    "https://quickspin-runtime.vercel.app",
    "27de7b3b4119b6499eda79effccadf262028de58",
    "dpl_Gu77jod1hxSEPu8Sz9pRPAq3zbyL",
    "All five routes returned **HTTP 200 OK**",
  ],
  "evidence/security/SECURITY-GATE.md": ["PASS", "0 vulnerabilities"],
  "evidence/security/SUPPLY-CHAIN-REVIEW.md": [
    "REVIEWED_WARNING_NONRUNTIME",
    "esbuild@0.28.2",
    "not a shipped runtime dependency",
  ],
  "submission/VIDEO-SHOT-LOCK.md": [
    "Canonical narrative mapping",
    "PROBLEM → PAIN → TRIGGER → LIVE WORKFLOW → WOW → CONSEQUENCE → ACTION → TECHNICAL PROOF → IMPACT → CLOSE",
    "value before technology",
  ],
  "state/CANONICAL-STATE.yaml": [
    "workstream: FINAL_QC_AND_SUBMISSION_FINISHER",
    "REAL_FAILURE_GT_FAKE_SUCCESS",
    "project_complete: false",
    "runtime_gate: PASS_VERIFIED_PUBLIC_RUNTIME",
    "runtime_source_sha: 27de7b3b4119b6499eda79effccadf262028de58",
    "runtime_url: https://quickspin-runtime.vercel.app",
    "visual_architecture: FUTURE_CLASSIC_MULTI_PAGE",
  ],
  "state/HANDOVER.yaml": ["FINAL_QC_AND_SUBMISSION_FINISHER", "project_complete: false", "rollback"],
  ".pbpd/state/ACTIVITY-TRACE.yaml": [
    "workstream: FINAL_QC_AND_SUBMISSION_FINISHER",
    "handoff-to-finisher",
    "PROJECT_COMPLETE_REQUIRES_TERMINAL_RECONCILIATION",
  ],
  "HACKATHON-STATE.yaml": [
    "BUILD_CANDIDATE_READY_WITH_LIMITATIONS",
    "project_complete: false",
    "concrete_real_negative_event: PASS",
    "handoff_to_finisher: ACTIVE",
    "HOI: UNKNOWN_IN_REPO_LEGACY_IMPORT",
    "judge_coverage: PASS",
    "supply_chain_install_script_policy: REVIEWED_WARNING_NONRUNTIME",
  ],
  "HACKATHON-HANDOFF.yaml": [
    "ACTIVE_WITH_BLOCKING_FINAL_GATES",
    "forbidden_claims",
    "REAL_FAILURE_GT_FAKE_SUCCESS",
  ],
  "HACKATHON-OPERATING-GATES.yaml": [
    "REAL_NEGATIVE_EVENT",
    "UNKNOWN_ABSTENTION",
    "PUBLIC_RUNTIME",
    "SUBMISSION_PACKAGE",
    "PROJECT_COMPLETE",
  ],
};

const loaded = new Map();
for (const [path, needles] of Object.entries(required)) {
  if (!existsSync(path)) throw new Error(`missing canonical artifact: ${path}`);
  const text = readFileSync(path, "utf8");
  loaded.set(path, text);
  for (const needle of needles) {
    if (!text.includes(needle)) throw new Error(`${path} missing required marker: ${needle}`);
  }
}

const canonical = loaded.get("state/CANONICAL-STATE.yaml");
const hackathon = loaded.get("HACKATHON-STATE.yaml");
const handoff = loaded.get("HACKATHON-HANDOFF.yaml");
const reconciliation = loaded.get("evidence/RECONCILIATION.md");
const claims = loaded.get("evidence/CLAIM-LEDGER.md");
const orchestration = loaded.get("evidence/ORCHESTRATION-JPA.md");
const runtime = loaded.get("evidence/runtime/VERCEL-PRODUCTION-RUNTIME.md");

for (const [name, text] of [
  ["state/CANONICAL-STATE.yaml", canonical],
  ["HACKATHON-STATE.yaml", hackathon],
  ["HACKATHON-HANDOFF.yaml", handoff],
]) {
  if (/project_complete:\s*true/.test(text)) throw new Error(`${name} illegally promotes PROJECT_COMPLETE`);
}

if (canonical.includes("DEPENDENCY_VULNERABILITY_RECONCILIATION")) {
  throw new Error("canonical state still lists the closed dependency vulnerability reconciliation as open");
}
if (canonical.includes("PUBLIC_DEPLOYMENT_PROOF\n")) {
  throw new Error("canonical state still lists public deployment proof as an open blocker");
}
if (reconciliation.includes("Dependency audit open")) {
  throw new Error("reconciliation still describes the closed dependency audit as open");
}
if (claims.includes("public judge runtime is live | UNKNOWN / NOT_CLAIMED")) {
  throw new Error("claim ledger still describes the now-verified public runtime as unknown");
}
if (runtime.includes("83da2b807e2072bde30a76c72937c3cbe74ff389")) {
  throw new Error("runtime evidence still points at the pre-future-classic production SHA");
}
if (existsSync(".github/workflows/final-judge-patch.yml")) {
  throw new Error("one-shot final judge patch workflow must not remain active after successful migration");
}
if (!orchestration.includes("HUMAN SUBMIT") || !orchestration.includes("POST-MORTEM")) {
  throw new Error("orchestration trace does not preserve terminal human-submit/post-mortem stages");
}
if (!orchestration.includes("UNKNOWN_IN_REPO")) {
  throw new Error("orchestration trace must preserve missing upstream repo evidence as UNKNOWN_IN_REPO");
}

console.log(`judge evidence verified: ${Object.keys(required).length} canonical artifacts + cross-state invariants`);
