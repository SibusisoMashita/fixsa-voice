# Final verification report

Date: 18 September 2026

Environment: local macOS workspace plus `https://fixsa.valosystems.co.za`; Node.js 26, Next.js 16, PHP 8.5, Laravel 13, MariaDB

Data classification: wholly synthetic

## Automated evidence

| Check | Command | Result |
|---|---|---|
| Type safety | `npm run typecheck` | Pass |
| cPanel static export | `npm run build:cpanel` | Pass, 26 static/SSG routes generated in `out/` |
| Lint | `npm run lint` | Pass, zero warnings |
| Unit/integration | `npm test` | Pass, 24 tests |
| Laravel API | `npm run test:api` | Pass, 13 tests and 70 assertions |
| Live voice workflows | `npm run test:voice:live` | Pass, 8 core cases plus targeted Proof of Fix session |
| Browser journeys | `npm run test:e2e` | Pass, 40 runs across desktop, 360×800, 390×844, and tablet |
| Dependency audit | `npm run audit` | Pass, zero vulnerabilities |
| PHP dependency audit | `npm run audit:api` | Pass, zero security advisories |
| Browser console | In-app browser inspection | Pass, no error or warning entries |
| Responsive overflow | Rendered width inspection | Pass, no page-level horizontal overflow |
| Hosted HTTPS/API | live health, CORS, privacy, auth and voice-token probes | Pass; MariaDB health is `ok`, public projection is allowlisted, unauthenticated operator access is `401`, and a short-lived AssemblyAI token is minted server-side |
| Hosted browser journeys | Playwright against the production URL | Pass, 9 non-mutating desktop journeys plus the reset isolated Proof of Fix journey |

## Implemented acceptance evidence

- Consent precedes all audio capture.
- Demo and real adapters share nine validated tool definitions.
- Live partial/final transcript event handling is implemented for real mode.
- Real AssemblyAI sessions were exercised with 20 synthesized South African English resident turns.
- Four English voices were auditioned; `anna` was selected and all captured output remained below clipping.
- Create and merge actions require explicit read-back confirmation.
- Proof of Fix verifies or reopens claimed repairs only after explicit read-back confirmation.
- Danger language blocks ordinary submission and avoids unverified numbers.
- Public tracking uses an allowlisted field view.
- Residential public locations are replaced with a landmark label and public map coordinates are reduced to three decimals.
- Report creation, Proof of Fix, and operator transitions are transactional, idempotent where retryable, and append immutable audit events.
- Duplicate merge is reversible in the operator demo.
- Browser operator pages are a labelled synthetic preview; Laravel operator reads and writes require an active Sanctum operator with explicit token abilities.
- Every requested public, operator, legal, help, error, and loading route is present.
- Synthetic metrics, demo roles, inactive integrations, and non-dispatch status are labelled.

## Visual QA notes

- Verified landing at desktop and 360×800.
- Verified reporting at 390×844 with 132-pixel microphone control and 44-pixel-or-larger touch actions.
- Verified operations dashboard at 820×1180 and desktop.
- Verified the Proof of Fix journey at desktop and 390×844, including the public reopen outcome.
- Verified the operator access gate at 390×844 with one main landmark and no horizontal overflow.
- Corrected a navigation breakpoint specificity issue found during visual inspection.
- Corrected nested landmark markup found during the final operator-gate inspection.
- Captured repository screenshots for landing, mobile reporting, operations, and judge scenarios.
- Captured final production screenshots for the landing page, 390px reporting flow, Proof of Fix, and operations dashboard.

Real AssemblyAI audio was exercised with an owner-authorised, ignored local credential. The permanent key remained server-side and was not written to source, fixtures, reports, or screenshots. Full voice evidence and limitations are in [voice-quality-report.md](voice-quality-report.md).
