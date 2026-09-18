# FixSA database design

The production adapter is Laravel 13 with MariaDB. The schema is designed around operational invariants rather than UI screens.

## Core relationships

```text
areas 1 ── * reports 1 ── * transcript_segments
                    ├──── * evidence
                    ├──── * report_notes
                    ├──── * status_events
                    ├──── * report_assignments
                    ├──── * resolution_verifications
                    ├──── * duplicate_matches
                    └──── * audit_events (polymorphic subject)

reports * ── * reports through report_merges
users   1 ── * assignments, notes, status events, and audit events
```

## Deliberate choices

- Sortable ULIDs identify domain records without exposing row counts. Human references use a separate locked yearly sequence such as `FSA-2026-1000`.
- String-backed PHP enums keep API values explicit while avoiding MariaDB native-enum lock-in.
- A public report is an allowlisted API resource. Internal notes and transcripts never enter the public projection.
- Status changes, assignments, merges, and Proof of Fix are histories. The current report row is the fast work-queue projection.
- `lock_version` prevents a stale operator screen from overwriting a newer change.
- `Idempotency-Key` protects retryable creates and mutations from duplicate writes.
- Evidence records include size, MIME type, visibility, and SHA-256 checksum; binary files stay outside the database.
- Audio is not stored. `audio_retention` records the policy outcome (`not_recorded` or `ephemeral_deleted`).
- Audit events are append-only by application policy and contain before/after projections plus a request UUID.

## Transaction boundaries

1. Report creation locks the yearly sequence, inserts the report, redacted transcript, first public event, and audit event as one transaction.
2. Proof of Fix locks the report, records the resident outcome, reopens failed/partial work, adds the public event and audit event, and commits atomically.
3. Operator status updates lock the report, enforce the transition graph and expected `lock_version`, then append status, note, verification, and audit records atomically.

## Queue and lookup indexes

- `(status, priority, sla_due_at)` for the operator queue.
- `(area_id, status, created_at)` and `(category, status, created_at)` for triage filters.
- `(latitude, longitude)` for a duplicate-detection bounding-box prefilter before distance scoring.
- Unique report references, report/candidate duplicate pairs, merged child reports, and scoped idempotency keys.
- `(report_id, occurred_at)` for public and operator timelines.

## Retention and cleanup

No scheduled deletion is enabled in the hackathon build. Production policy must define retention periods for transcripts, evidence, idempotency responses, access tokens, and audits before real resident data is accepted. Expired idempotency rows can be deleted safely; reports and audit records require an authorised retention policy.
