export const FIXSA_VOICE_ID = "anna";

export const FIXSA_GREETING = "Hi, you’re speaking with FixSA Voice. This is a demo, not an emergency service. What’s happening?";

export const FIXSA_VOICE_INPUT = {
  format: { encoding: "audio/pcm" },
  language_codes: ["en"],
  transcription_mode: "balanced",
  transcription_prompt: "South African English civic service reports. Expect street names, landmarks, townships, municipalities, water leaks, potholes, sewer overflows, electricity faults, streetlights and illegal dumping.",
  keyterms: ["FixSA", "Tamboti Road", "Ivory Park", "Johannesburg", "municipality", "pothole", "streetlight", "sewer overflow", "illegal dumping"],
  voice_focus: "near-field",
  voice_focus_threshold: 0.55,
  turn_detection: {
    vad_threshold: 0.5,
    min_silence: 900,
    max_silence: 2600,
    interrupt_response: true,
    interruption_delay: 160,
  },
} as const;

export const FIXSA_VOICE_OUTPUT = {
  voice: FIXSA_VOICE_ID,
  format: { encoding: "audio/pcm" },
  volume: 92,
} as const;
