# FixSA Voice implementation plan

## Scope and guardrails

- Build a public, synthetic-data-only hackathon demo. Never claim municipal dispatch or official status.
- Keep AssemblyAI credentials server-side; use one-time Voice Agent tokens for the browser.
- Require recording consent and explicit read-back confirmation before create/merge.
- Stop the ordinary flow for immediate-danger language and provide region-neutral emergency guidance.
- Preserve audio ephemerally by default and redact sensitive identifiers from public output.

## Delivery plan

1. Establish the TypeScript domain, schemas, deterministic fixtures, redaction, safety, SLA, and duplicate matching.
2. Build the shared accessible visual system, public shell, operator shell, and every required route/state.
3. Implement the report journey, review confirmation gate, tracking, demo role, and reversible demo mutations.
4. Add the AssemblyAI Voice Agent browser adapter behind the same tools used by demo mode.
5. Add API, unit, and Playwright coverage; validate responsive layouts and production build.
6. Produce the submission pack, architecture diagrams, runbook, rollback notes, and verification report.

## Architecture decision

Next.js App Router is used for a single deployable web application with server-only token issuance and TypeScript shared contracts. Demo data is deterministic and local-first so judging never depends on a paid key. A documented Postgres-compatible schema and repository boundary make the demo store replaceable without changing the voice or UI contracts.
