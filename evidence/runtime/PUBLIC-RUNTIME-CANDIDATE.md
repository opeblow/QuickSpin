# Public Runtime Candidate

Status: **PENDING_ENABLEMENT / NOT YET EVIDENCE**

## Candidate

QuickSpin's static demo is prepared for GitHub Pages using `.github/workflows/pages.yml`.

Expected repository Pages path after successful deployment:

`https://faadil1.github.io/quickspin/`

This string is a **candidate location, not a verified live URL**. It must not be placed in the submission or README as a live demo until the deployment job returns a successful `page_url` and the rendered site is externally fetched.

## Deployment contract

1. Run canonical `npm ci` on Node 22.
2. Run `npm run check` before deployment.
3. Build the Vite demo with repository base `/quickspin/`.
4. Upload only `dist-demo/` as the Pages artifact.
5. Deploy through the GitHub Pages deployment action.
6. Record the returned `page_url` and deployment run as runtime evidence.
7. Fetch the public URL and verify the page loads before promoting `PUBLIC_DEPLOYMENT_PROOF` to PASS.

## Current authority boundary

The repository has a reproducible deployment workflow, but Pages enablement is a repository setting/administration surface. The available GitHub connection can edit repository content and workflows but does not expose Pages-administration enablement. Therefore the deployment gate remains open until a real deployment succeeds.

## Failure rule

A workflow file, an expected URL, or a successful local/static build is **not** public runtime evidence. If Pages is disabled and the deployment fails, that failure must be retained in the Failure Ledger and the gate remains open.
