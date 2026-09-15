# Supply-Chain Install-Script Review

Status: **REVIEWED_WARNING_NONRUNTIME**

During Node 24 / npm 11 CI, `npm ci` reported one dependency with an install script not covered by a project `allowScripts` policy:

- `esbuild@0.28.2` — `postinstall: node install.js`

This is **not** being represented as an npm vulnerability. The dependency-security gate remains separately evidenced by:

- full `npm audit`: **0 vulnerabilities**;
- production-only `npm audit`: **0 vulnerabilities**;
- `npm pack --dry-run`: build/test toolchain is not shipped in the QuickSpin package surface;
- Node 22 + Node 24 typecheck/tests/builds pass.

The warning is retained because install scripts are a distinct supply-chain authority surface from CVE/audit findings.

Official npm guidance documents `allowScripts` / `npm install-scripts` as the mechanism for reviewing dependency install scripts:

- https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/

## Decision

Do **not** silently blanket-approve install scripts and do not treat `audit = 0` as proof that install-script policy has been reviewed.

For the current hackathon candidate:

- `esbuild` is development/build tooling, not a shipped runtime dependency;
- the package-boundary evidence excludes the toolchain from the published artifact;
- the candidate builds successfully on the supported Node matrix;
- therefore this warning is **non-blocking for the browser runtime**, but remains explicitly documented.

If the project later adopts strict install-script policy, approval/denial should be pinned to the reviewed dependency/version rather than using a blanket allow-all escape hatch.
