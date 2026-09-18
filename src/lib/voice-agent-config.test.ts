import { describe, expect, it } from "vitest";
import { FIXSA_GREETING, FIXSA_VOICE_INPUT, FIXSA_VOICE_OUTPUT } from "./voice-agent-config";
import { FIXSA_AGENT_PROMPT } from "./voice-tools";

describe("voice agent conversation quality", () => {
  it("uses a supported English voice and bounded natural turn timing", () => {
    expect(["alba", "eve", "george", "jane", "jean", "mary", "michael", "anna", "charles", "paul", "vera"]).toContain(FIXSA_VOICE_OUTPUT.voice);
    expect(FIXSA_VOICE_INPUT.turn_detection.min_silence).toBeGreaterThanOrEqual(700);
    expect(FIXSA_VOICE_INPUT.turn_detection.max_silence).toBeLessThanOrEqual(3000);
    expect(FIXSA_VOICE_INPUT.turn_detection.interrupt_response).toBe(true);
  });

  it("keeps the greeting concise and transparent", () => {
    expect(FIXSA_GREETING.split(/\s+/)).toHaveLength(16);
    expect(FIXSA_GREETING).toMatch(/demo/i);
    expect(FIXSA_GREETING).toMatch(/not an emergency service/i);
  });

  it("contains explicit natural-speech, privacy, safety and operator boundaries", () => {
    expect(FIXSA_AGENT_PROMPT).toContain("one or two short sentences");
    expect(FIXSA_AGENT_PROMPT).toContain("Ask one question at a time");
    expect(FIXSA_AGENT_PROMPT).toContain("Never repeat phone numbers");
    expect(FIXSA_AGENT_PROMPT).toContain("Never call update_report_status for a resident");
    expect(FIXSA_AGENT_PROMPT).toContain("contact their official local emergency service");
  });
});
