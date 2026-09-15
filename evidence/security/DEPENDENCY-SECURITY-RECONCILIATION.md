# Dependency Security Reconciliation

Generated from npm audit on 2026-09-15T04:26:24.878Z.

Counts: {"info":0,"low":0,"moderate":3,"high":1,"critical":1,"total":5}

| Package | Severity | Direct | Range | Fix | Via |
|---|---|---:|---|---|---|
| @vitest/mocker | moderate | false | <=4.1.10 | vitest@5.0.0 (major) | @vitest/mocker:Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock; vite |
| esbuild | moderate | false | <=0.24.2 | vite@8.3.0 (major) | esbuild:esbuild enables any website to send any requests to the development server and read the response |
| vite | high | true | <=6.4.2 | vite@8.3.0 (major) | vite:Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling; vite:launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows; vite:vite: `server.fs.deny` bypass on Windows alternate paths; esbuild |
| vite-node | moderate | false | <=2.2.0-beta.2 | vitest@5.0.0 (major) | vite |
| vitest | critical | true | <=4.1.10 | vitest@5.0.0 (major) | @vitest/mocker; vitest:When Vitest UI server is listening, arbitrary file can be read and executed; vitest:Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock; vite; vite-node |

## Interpretation rule

A package count alone does not establish shipped-runtime exploitability. We classify each advisory by direct/transitive status, build-time/runtime reachability, and whether the vulnerable code ships in `dist/`. No `npm audit fix --force` is permitted without this reconciliation.
