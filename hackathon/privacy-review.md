# Final submission privacy review

Reviewed: 18 September 2026

Scope: public repository, hosted application, 16:9 cover, production screenshots, presentation, PDF, and 90-second demo video.

## Result

Pass. The submission pack contains only labelled synthetic hackathon data.

- No API key, database password, session token, `.env` file, or server path appears in tracked source or submission media.
- The permanent AssemblyAI key is stored only in the protected Laravel server environment; the browser receives a short-lived token.
- No cPanel, AssemblyAI dashboard, email-account, or other signed-in account screen appears in screenshots, slides, or video.
- No real resident name, contact detail, identity number, private-home location, voice recording, or client data appears in the pack.
- Public report views use allowlisted fields and reduced location precision. Private transcripts, internal notes, assignees, and evidence stay out of the public projection.
- The microphone flow requires consent, provides a keyboard alternative, and states that demo audio is not retained.
- All operational records, locations, teams, metrics, references, and timelines shown to judges are clearly identified as synthetic.
- Emergency language stops ordinary automation and does not display an unverified emergency number.

Final public URLs:

- Application: https://fixsa.valosystems.co.za
- Repository: https://github.com/SibusisoMashita/fixsa-voice
- Release pack: https://github.com/SibusisoMashita/fixsa-voice/releases/tag/v1.0.0-hackathon
