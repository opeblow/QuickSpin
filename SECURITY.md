# Security Policy

## Supported versions

This project is currently a hackathon prototype. Only the latest commit on `main` is supported.

| Version | Supported |
|---|---|
| main (latest) | ✅ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Report privately so a fix can ship before details are public.

- **Preferred:** email `security@<your-domain>` (replace with your real inbox — see note below)
- **Alternative:** open a [private security advisory](https://github.com/opeblow/QuickSpin/security/advisories/new) on GitHub.

You should receive a reply within **72 hours**. If you don't, follow up so we don't lose it.

## What to include

- Project / component affected
- Description of the vulnerability + impact
- Steps to reproduce (or a minimal PoC)
- Affected versions
- Any potential mitigations you've considered

## Scope

This repo is a **client-side prototype**. Notable attack surface:

- **XSS via the embed** — any host app embedding the widget should treat all `status`/`progress`
  text as untrusted input. We never `innerHTML` user-controlled strings, but if you find a path
  that does, that's a high-priority report.
- **`localStorage` persistence** — streaks/scores are mutable locally. Not a security boundary.
- **Simulated checkout** — the Vault payment flow is **fake** (`sim_*` IDs, no real charge).
  Never rely on it for real payments. Production must swap in a real gateway.

## Responsible disclosure

Please allow reasonable time for a fix before public disclosure. We'll credit reporters in release
notes (unless you prefer anonymity).

---

> **Note for the author:** replace `security@<your-domain>` with a real address before pushing.