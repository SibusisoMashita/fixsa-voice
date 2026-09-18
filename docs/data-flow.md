# Voice and work-order data flow

```mermaid
sequenceDiagram
  actor R as Resident
  participant UI as FixSA browser
  participant S as Token server
  participant A as AssemblyAI Voice Agent
  participant T as Civic tools
  participant D as Demo repository

  R->>UI: Accept consent and start microphone
  UI->>S: GET /api/voice/token
  S->>A: Mint one-time token with server key
  A-->>S: Temporary token
  S-->>UI: Temporary token only
  UI->>A: Connect + session.update
  loop Live conversation
    R->>A: PCM16 audio
    A-->>UI: transcript.user.delta
    A-->>UI: transcript.user
    A-->>UI: transcript.agent + reply.audio
  end
  A-->>UI: tool.call classify_service_issue
  UI->>T: Validate and extract
  T-->>UI: Structured fields + safety state
  A-->>UI: tool.call search_nearby_reports
  UI->>T: Category + location + detail
  T->>D: Read open synthetic reports
  D-->>T: Candidate matches
  T-->>UI: Score, distance, rationale
  UI-->>R: Explain match + full read-back
  R->>UI: Explicit confirmation
  alt Immediate danger
    UI-->>R: Stop flow + official emergency guidance
  else New report
    UI->>T: create_service_request confirmed=true
    T->>D: Add synthetic report + audit event
  else Duplicate selected
    UI->>T: merge_with_existing_report confirmed=true
    T->>D: Append evidence + reversible audit event
  end
  D-->>UI: Reference, status, SLA
  UI-->>R: Speak and show result
  UI->>A: session.end
```

## Public-view projection

Only reference, category, approximate location, status timeline, SLA state, and approved public notes cross into public tracking. Full transcripts, internal notes, assignees, contact identifiers, evidence objects, tool arguments, and exact private-home detail stay outside that projection.
