# FixSA Voice

> **Speak. Track. Fix.** A mobile-first voice service-delivery agent built by VALO Systems for the AssemblyAI Voice Agent Hackathon.

![FixSA Voice cover](public/cover-image.svg)

FixSA Voice turns a resident’s spoken description of a water leak, pothole, electricity fault, sewer overflow, broken streetlight, illegal dumping, or damaged public asset into a complete, deduplicated, trackable work order. It asks only for missing information, explains possible duplicates, reads the completed report back, and requires explicit confirmation before creating or merging anything.

## Demo boundary

FixSA Voice is a **hackathon demonstration**, not an official government, municipal, utility, dispatch, or emergency service. All seeded people, locations, references, teams, metrics, notes, and status changes are synthetic. A demo reference is not evidence that a real operator received a report.

If speech indicates immediate danger, the ordinary work-order flow stops. The interface tells the resident to move to safety and contact the appropriate official local emergency service. It does not fabricate or display an unverified emergency number.

## Why this product

Residents naturally describe a situation as a story, while service systems expect structured fields. Traditional forms make residents translate between the two. FixSA Voice uses real-time conversation to collect category, location, landmark, duration, severity, hazards, people affected, and supporting detail—then applies priority, SLA, duplicate, safety, and privacy rules consistently.

## Product journeys

- Public landing, report, clarification/review, success, tracking, demo scenarios, about, privacy, terms, accessibility, help, 404, and recovery states.
- Operator dashboard, report queue, report detail, duplicate review, accessible map triage, analytics, and settings/integrations.
- Deterministic one-click scenarios for a water leak, dangerous electricity fault, pothole, and duplicate report.
- Resident, operator, supervisor-ready data model, plus an HTTP-only-cookie demo-role gate with no private credentials.

## Screenshots

| Resident experience | Operations workspace |
|---|---|
| ![FixSA Voice landing page](docs/screenshots/landing.png) | ![FixSA Voice operations dashboard](docs/screenshots/operations-dashboard.png) |

Additional captures: [mobile reporting](docs/screenshots/mobile-report.png) and [judge scenarios](docs/screenshots/judge-scenarios.png).

## AssemblyAI integration

The real adapter uses the [AssemblyAI Voice Agent API](https://www.assemblyai.com/docs/voice-agents/voice-agent-api):

1. The browser requests a single-use, short-lived token from `/api/voice/token`.
2. The server mints it with `ASSEMBLYAI_API_KEY`; the permanent key never reaches browser JavaScript.
3. The browser opens `wss://agents.assemblyai.com/v1/ws`, sends an inline FixSA agent configuration (or an optional stored agent ID), and streams 24 kHz PCM16 audio.
4. `transcript.user.delta` drives visible live partials; final user and agent events build the accessible conversation timeline.
5. JSON-schema function tools call the same validated application contract used by demo mode.
6. `session.end` closes cleanly so a paid session does not remain in its resume grace period.

The implementation follows AssemblyAI’s current [browser integration](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/browser-integration), [client-side tools](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/tools/client-side-tools), and [events](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/events-reference) guidance, verified 18 September 2026.

### Structured tools

- `classify_service_issue`
- `search_nearby_reports`
- `confirm_report_details`
- `create_service_request`
- `merge_with_existing_report`
- `attach_evidence`
- `get_report_status`
- `update_report_status`

Create and merge operations fail closed without explicit confirmation. Immediate-danger electricity content produces `emergency_hold`, and public evidence is redacted before output.

### Language position

The UI exposes **English only**. Universal-3 Pro Streaming and current multilingual streaming offerings support additional languages, but FixSA does not claim production quality for them without South African user research, accent testing, and an authorised language rollout. The extension path is documented in [docs/language-and-accent-testing.md](docs/language-and-accent-testing.md).

## Architecture

```mermaid
flowchart LR
  R[Resident] --> UI[Next.js browser UI]
  UI -->|one-time token| API[Server token route]
  API -->|server-only key| AAI[AssemblyAI Voice Agent API]
  UI <-->|PCM16, transcripts, spoken replies| AAI
  AAI -->|JSON-schema tool.call| UI
  UI --> V[Zod-validated civic tools]
  V --> D[(Deterministic demo store)]
  V -. future authorised adapter .-> M[(Municipal / utility work-order API)]
  D --> P[Public redacted tracking]
  D --> O[Role-aware operator views]
```

See [docs/architecture.md](docs/architecture.md) and [docs/data-flow.md](docs/data-flow.md) for the full boundaries and sequence diagrams. PostgreSQL-compatible reference migrations are in `db/migrations/`.

## Privacy and safety

- Consent is required before microphone access or transcription.
- Audio is ephemeral by default and is never committed, logged, or placed in fixtures.
- Synthetic data is the only supported public-demo data.
- Phone numbers, South African ID numbers, emails, and private-home identifiers are redacted from tool output and public views.
- Public tracking omits full transcripts, internal notes, assignment detail, contact fields, and evidence marked private.
- The safety classifier and UI both stop normal automation for fire, exposed electricity, gas, severe injury, crime in progress, or medical emergencies.
- No emergency number is shown until a future authorised region configuration verifies it.

## Local setup

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode works without secrets. Try:

- `/demo` for judge scenarios
- `/track?ref=FSA-2026-1842` for public tracking
- `/ops` for the labelled safe demo-role entry and operations workspace

### Real AssemblyAI mode

Add only the server-side key to `.env.local`:

```dotenv
FIXSA_DEMO_MODE=false
ASSEMBLYAI_API_KEY=your_server_only_key
```

Optionally add a non-secret stored agent ID as `NEXT_PUBLIC_ASSEMBLYAI_AGENT_ID`. When omitted, FixSA sends an inline agent configuration. Never prefix the API key with `NEXT_PUBLIC_`.

Use HTTPS or `localhost` for microphone access. Current browser audio handling keeps the device sample rate and resamples capture to 24 kHz inside an AudioWorklet for Chromium, Firefox, and Safari compatibility.

## Commands

```bash
npm run dev              # local application
npm run lint             # ESLint
npm run typecheck        # strict TypeScript
npm test                 # Vitest unit and integration tests
npm run test:e2e         # Playwright journeys and responsive projects
npm run test:e2e:mobile  # 360×800 and 390×844 only
npm run build            # production build
npm run audit            # high-severity dependency audit
npm run verify           # lint + types + unit tests + build
npm run seed             # validate synthetic fixture schema
npm run reset            # explain safe browser reset path
```

## Deployment

The simplest supported target is a Node-capable Next.js platform such as Vercel or Render. Static-only hosting will not support token minting. Configure `ASSEMBLYAI_API_KEY` as a protected server secret, set `NEXT_PUBLIC_APP_URL`, deploy, then verify `/api/health` without exposing the key. Full steps, smoke tests, and rollback are in [docs/deploy-runbook.md](docs/deploy-runbook.md).

No public deployment is performed automatically from this repository; it requires the owner’s account access and approval.

The hackathon operations workspace is separated from public routes by a four-hour, HTTP-only demo-role cookie. This is an access boundary for the synthetic judge experience, not production authentication. A live deployment must replace it with a trusted identity provider and enforce authorisation again at every protected data mutation.

## Testing and quality

Unit coverage targets classification, extraction, validation, priority, SLA, duplicate scoring, redaction, confirmation, tool state transitions, and safety escalation. Playwright covers successful voice reporting, manual fallback, duplicate merge, dangerous-issue stop, tracking, operator triage, mobile navigation, microphone-denied guidance, and API failure.

The responsive matrix covers 360×800, 390×844, 820×1180, and desktop Chromium. Accessibility features include semantic HTML, keyboard navigation, visible focus, reduced motion, live regions, transcript text, touch targets, and a map list alternative.

See [docs/final-verification.md](docs/final-verification.md) for the latest evidence.

## Limitations

- Browser-local demo persistence is not a production system of record and can be reset.
- Map coordinates and operational metrics are synthetic; map tiles require network access.
- No municipal API, identity provider, SMS, emergency service, or geocoder is connected.
- Speech quality depends on microphone, browser, network, background noise, accent, and model availability.
- A production launch requires a lawful data-processing basis, operator agreements, abuse controls, monitoring, retention policy, disaster recovery, and verified regional emergency guidance.

## Hackathon submission pack

Submission copy, demo script, video shot list, deck outline, checklist, and judging evidence are in [`hackathon/`](hackathon/). The repository-native cover asset is [`public/cover-image.svg`](public/cover-image.svg).

Built by **VALO Systems**. If founder attribution is needed, use **Sibusiso Mashita** only.
