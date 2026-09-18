# Final verification report

Date: 18 September 2026

Environment: local macOS workspace, Node.js 26, Next.js 16

Data classification: wholly synthetic

## Automated evidence

| Check | Command | Result |
|---|---|---|
| Type safety | `npm run typecheck` | Pass |
| Production compilation | `npm run build` | Pass, all required routes generated |
| Lint | `npm run lint` | Pass, zero warnings |
| Unit/integration | `npm test` | Pass, 19 tests |
| Live voice workflows | `npm run test:voice:live` | Pass, all 8 cases after one prompt-approved safety-phrase assertion correction |
| Browser journeys | `npm run test:e2e` | Pass, 36 runs across desktop, 360×800, 390×844, and tablet |
| Dependency audit | `npm run audit` | Pass, zero vulnerabilities |
| Browser console | In-app browser inspection | Pass, no error or warning entries |
| Responsive overflow | Rendered width inspection | Pass, no page-level horizontal overflow |

## Implemented acceptance evidence

- Consent precedes all audio capture.
- Demo and real adapters share eight validated tool definitions.
- Live partial/final transcript event handling is implemented for real mode.
- Real AssemblyAI sessions were exercised with 17 synthesized South African English resident turns.
- Four English voices were auditioned; `anna` was selected and all captured output remained below clipping.
- Create and merge actions require explicit read-back confirmation.
- Danger language blocks ordinary submission and avoids unverified numbers.
- Public tracking uses an allowlisted field view.
- Duplicate merge is reversible in the operator demo.
- Direct operator routes require the labelled HTTP-only-cookie demo-role entry.
- Every requested public, operator, legal, help, error, and loading route is present.
- Synthetic metrics, demo roles, inactive integrations, and non-dispatch status are labelled.

## Visual QA notes

- Verified landing at desktop and 360×800.
- Verified reporting at 390×844 with 132-pixel microphone control and 44-pixel-or-larger touch actions.
- Verified operations dashboard at 820×1180 and desktop.
- Verified the operator access gate at 390×844 with one main landmark and no horizontal overflow.
- Corrected a navigation breakpoint specificity issue found during visual inspection.
- Corrected nested landmark markup found during the final operator-gate inspection.
- Captured repository screenshots for landing, mobile reporting, operations, and judge scenarios.

Real AssemblyAI audio was exercised with an owner-authorised, ignored local credential. The permanent key remained server-side and was not written to source, fixtures, reports, or screenshots. Full voice evidence and limitations are in [voice-quality-report.md](voice-quality-report.md).
