# Judging matrix

| Criterion | What judges can see | Repository evidence |
|---|---|---|
| Application of Technology | Live partial/final transcript UI, interruption-ready voice adapter, spoken reply playback, nine JSON-schema tools, confirmation gating, shared real/demo contract, and a server-minted one-time token | `src/components/VoiceReportClient.tsx`, `src/lib/voice-tools.ts`, `/api/v1/voice/token`, unit, Laravel, and Playwright tests |
| Presentation | Distinctive responsive identity, one-click judge scenarios, concise 90–120 second narrative, visible demo boundary, cover asset | `/`, `/demo`, `public/cover-image.svg`, `demo-script.md`, `video-shot-list.md` |
| Business Value | Structured intake, SLA routing, self-service tracking, operator queue/map, duplicate reduction, and fewer false closures through resident verification | `/track`, `/verify`, `/ops`, `/ops/reports`, `/ops/analytics`, Laravel/MariaDB work-order schema |
| Production credibility | cPanel-native static frontend plus Laravel API, transactional writes, locked human references, idempotency, optimistic locking, private/public projections, Sanctum abilities, and indexed work queues | `api/`, `docs/database-design.md`, Laravel feature tests, `deploy/frontend.htaccess` |
| Originality | Proof of Fix turns “resolved” into a resident-verifiable claim; partial and failed repairs reopen atomically with public and operator audit evidence | `/verify`, `/track`, Proof of Fix unit, Laravel, and Playwright tests, `verify_resolution` tool |

## Demonstrated behaviours

- Water leak: natural speech → structured report → duplicate search → confirmation → reference.
- Pothole: traffic hazard influences priority and SLA.
- Duplicate: match rationale is visible and resident consent controls merge.
- Exposed electricity: normal automation stops; official emergency guidance appears; no number is invented.
- Proof of Fix: a resident confirms a repair or reopens a partial/failed resolution by voice.
- API outage or denied microphone: keyboard fallback remains available.
