# Voice quality and live conversation verification

Date: 18 September 2026

This evaluation used real AssemblyAI Voice Agent sessions. Resident input was synthesized with the installed macOS `Tessa` South African English voice at 172 words per minute, converted to mono 24 kHz PCM16, and streamed in real time. Generated audio and raw session reports stay in the ignored `artifacts/voice-eval/` directory.

## Voice selection

The same greeting was auditioned with four current English voices:

| Voice | Greeting duration | Peak | RMS | Result |
|---|---:|---:|---:|---|
| `alba` | 6.27 s | 0.552 | 0.088 | Clean |
| `anna` | 7.23 s | 0.610 | 0.088 | Selected |
| `vera` | 6.12 s | 0.604 | 0.074 | Clean |
| `paul` | 6.12 s | 0.861 | 0.095 | Clean, louder peak |

`anna` was selected for its calmer pace and British-English pronunciation profile, which was the closest available fit for this English-only South African demo. This is a product choice, not a claim that the voice is South African.

## Final cases

| Case | Verified behavior | Outcome |
|---|---|---|
| Water creation | Classification, nearby search, read-back, confirmation, creation | Pass |
| Pothole creation | Generic street extraction, hazard detail, confirmation, creation | Pass |
| Duplicate merge | Nearby match, full read-back, explicit merge consent, grouped reference | Pass |
| Electrical danger | Safety-distance guidance, official emergency-service referral, no create/merge | Pass |
| Clarification | One-at-a-time location clarification, read-back, creation | Pass |
| Privacy | Supplied email is not repeated in speech | Pass |
| Correction | Corrected landmark and duration invalidate earlier state and require a new confirmation | Pass |
| Resident permissions | Public status lookup succeeds; resident status mutation is refused | Pass |
| Proof of Fix | Resolved-report lookup, partial-fix read-back, explicit confirmation, automatic reopen | Pass |

The final consolidated run passed every substantive check except one wording assertion: the safe phrase “move to safety” was not included in the test’s accepted alternatives. After adding that exact prompt-approved phrase, the targeted electrical-danger rerun passed 1/1. No product safety behavior was changed for that assertion repair.

After Proof of Fix was added, a targeted live AssemblyAI session passed every new check: `get_report_status`, `confirm_report_details`, and `verify_resolution` completed in order; the spoken read-back preceded the state change; the agent explained the reopen; all three resident turns were transcribed; and the session had no protocol errors. The substantive repair statements transcribed exactly; the only reference variation was punctuation and spacing in “FSA 2026 1811.”

Across the consolidated run, all 17 resident turns were transcribed. Mean literal word error rate was 8.7%; ordinary civic sentences were generally exact, while most counted differences came from reference-number spacing and spoken email formatting. Agent audio peaked at 0.748, below clipping.

## Adjustments made from live evidence

- Selected `anna` and reduced output volume to 92.
- Added civic keyterms, an English transcription prompt, balanced transcription, near-field voice focus, and bounded turn timing.
- Rewrote the prompt for short conversational replies, contractions, one question at a time, grouped reference pronunciation, and explicit anti-bot phrasing.
- Scheduled PCM reply chunks continuously and stop queued playback on interruption or mute; this prevents overlapping or chopped speech.
- Added leading silence to the evaluator so voice activity detection does not lose the first words.
- Required geographic proximity for duplicate matching; semantic similarity alone no longer marks reports kilometres apart as nearby.
- Grouped split resident and agent transcript segments by conversational turn.
- Enforced confirmation and resident/operator permissions in the client tool contract, independent of model prompt compliance.
- Applied the same fail-closed read-back confirmation gate to resident repair verification and automatic reopen actions.

## Limits

Synthetic speech is repeatable and useful for regression testing, but it is not a substitute for listening sessions with consenting South African speakers across accents, ages, microphones, network conditions, and background noise. The saved WAV files support human audition, while this automated report checks transcription, workflow, protocol, safety, privacy, and signal health rather than claiming a human mean-opinion score.
