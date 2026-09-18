# Language and South African accent testing

## Shipped scope

English only. The control does not advertise languages that have not been validated in this product.

The automated baseline streams macOS `Tessa` (`en_ZA`) speech through real Voice Agent sessions. It covers repeatable workflow and transcription regressions but does not replace consenting human accent research. See [voice-quality-report.md](voice-quality-report.md) for the current matrix and measurements.

## Test plan

Recruit consenting speakers across South African English varieties and a range of devices, bandwidth conditions, ages, speech rates, and background noise. Use wholly synthetic civic scenarios and never capture real resident incidents. Measure:

- word and entity accuracy for street, area, landmark, category, duration, and hazard terms;
- end-of-turn quality, interruptions, and clarification rate;
- completion, correction, and abandonment rates;
- safety false negatives and false positives;
- performance with assistive technology and the keyboard alternative.

Prioritise keyterms such as local place names and service vocabulary only after the terms are reviewed for privacy and regional relevance.

## Multilingual extension

AssemblyAI currently offers multilingual streaming options, including Universal-3 Pro Streaming for six supported languages and Whisper Streaming for broader language coverage. Before adding a language, FixSA must choose the appropriate current model, verify official support, test code-switching and civic vocabulary with consenting local speakers, translate safety and privacy content professionally, and configure an authorised regional operator path. A language is not exposed merely because a model lists it.
