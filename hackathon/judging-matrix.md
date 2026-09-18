# Judging matrix

| Criterion | What judges can see | Repository evidence |
|---|---|---|
| Application of Technology | Live partial/final transcript UI, interruption-ready voice adapter, spoken reply playback, eight JSON-schema tools, confirmation gating, shared real/demo contract | `src/components/VoiceReportClient.tsx`, `src/lib/voice-tools.ts`, `/api/voice/token`, unit and Playwright tests |
| Presentation | Distinctive responsive identity, one-click judge scenarios, concise 90–120 second narrative, visible demo boundary, cover asset | `/`, `/demo`, `public/cover-image.svg`, `demo-script.md`, `video-shot-list.md` |
| Business Value | Structured complete intake, SLA/priority routing, self-service tracking, operator queue/map, duplicate reduction, simulated impact metrics | `/track`, `/ops`, `/ops/reports`, `/ops/analytics`, PostgreSQL schema |
| Originality | Resident-facing explainable duplicate matching, explicit merge choice, reversible merge audit, danger-aware stop rather than blind ticketing | `/report/review`, `/ops/duplicates`, safety tests and tool contract |

## Demonstrated behaviours

- Water leak: natural speech → structured report → duplicate search → confirmation → reference.
- Pothole: traffic hazard influences priority and SLA.
- Duplicate: match rationale is visible and resident consent controls merge.
- Exposed electricity: normal automation stops; official emergency guidance appears; no number is invented.
- API outage or denied microphone: keyboard fallback remains available.
