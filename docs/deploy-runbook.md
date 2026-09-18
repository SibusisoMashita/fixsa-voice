# Deploy and rollback runbook

## Supported topology

A Node-capable Next.js deployment with HTTPS. Vercel and Render are practical hackathon targets. Static-only hosting is unsupported because `/api/voice/token` must run server-side.

## Preflight

1. Run `npm ci`, `npm run verify`, `npm run test:e2e`, and `npm run audit`.
2. Confirm `.env`, `.env.local`, audio files, recordings, screenshots containing secrets, and personal data are absent from Git.
3. Confirm the public demo defaults to `FIXSA_DEMO_MODE=true` until a real AssemblyAI key and cost controls are approved.
4. Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS origin.
5. If real mode is approved, add `ASSEMBLYAI_API_KEY` only in the platform’s encrypted server environment. Do not expose or print it.

## Release

1. Deploy the immutable commit.
2. Open `/api/health` and confirm it returns only configuration state, never key material.
3. Run the water, danger, pothole, and duplicate judge scenarios.
4. Verify `/track?ref=FSA-2026-1842`, `/ops`, and all footer trust pages.
5. At 360×800 and 390×844, verify nav, consent, microphone control, keyboard fallback, review, and success.
6. If real mode is enabled, start one short test session, confirm partial/final transcripts and a tool call, send `session.end`, and inspect platform logs for absence of secrets and transcript content.

## Rollback

1. Disable real mode or remove the AssemblyAI server secret if spend, privacy, or voice behaviour is unsafe. Demo mode remains functional.
2. Promote the last known-good immutable deployment.
3. Confirm `/api/health`, core demo journeys, and tracking.
4. Record the failed commit, symptom, time, affected route, and whether any external session began.

Browser-local synthetic changes do not need data rollback; the Settings reset restores the seed view. A future database deployment must use a migration backup and an operator-approved data rollback plan.
