import { describe, expect, it } from "vitest";
import { assignPriority, calculateSlaDue, classifyIssue, detectImmediateDanger, extractDemoFields, findDuplicates, redactSensitiveText, slaHoursFor } from "./domain";
import { seedReports } from "./seed";

describe("issue extraction", () => {
  it("classifies supported issue categories deterministically", () => {
    expect(classifyIssue("A burst pipe is flooding the street")).toBe("water_leak");
    expect(classifyIssue("There is a deep pothole in the road")).toBe("pothole");
    expect(classifyIssue("The sewer manhole is overflowing")).toBe("sewer_overflow");
  });

  it("extracts a complete demo report from natural speech", () => {
    const fields = extractDemoFields("There is a large water leak near the clinic on Tamboti Road. It started yesterday and the road is flooding.");
    expect(fields.category).toBe("water_leak");
    expect(fields.location.area).toBe("Ivory Park");
    expect(fields.severity).toBe("high");
    expect(fields.hazards).toContain("Road flooding");
  });

  it("extracts a supplied street name outside the seeded demo locations", () => {
    const fields = extractDemoFields("There is a deep pothole on Church Street in Midrand near the taxi rank.");
    expect(fields.location.address).toBe("Church Street");
    expect(fields.location.area).toBe("Midrand");
    expect(fields.location.precision).toBe("confirmed");
  });
});

describe("safety and privacy", () => {
  it("stops ordinary automation for immediate danger", () => {
    expect(detectImmediateDanger("An exposed electrical cable is sparking by the school").requiresEmergencyGuidance).toBe(true);
    expect(detectImmediateDanger("A streetlight is not working").requiresEmergencyGuidance).toBe(false);
  });

  it("redacts common sensitive identifiers", () => {
    const result = redactSensitiveText("Call me on 082 123 4567 or me@example.com. ID 9001015009087, unit 12.");
    expect(result).not.toContain("082 123 4567");
    expect(result).not.toContain("me@example.com");
    expect(result).not.toContain("9001015009087");
    expect(result).toContain("[PHONE REDACTED]");
  });
});

describe("priority and SLA", () => {
  it("puts exposed electricity on a safety hold", () => {
    const fields = extractDemoFields("An exposed electrical cable is sparking beside the school gate.");
    expect(assignPriority(fields)).toBe("emergency_hold");
  });

  it("assigns deterministic SLA windows", () => {
    expect(slaHoursFor("urgent")).toBe(4);
    expect(calculateSlaDue("2026-09-18T10:00:00.000Z", "priority")).toBe("2026-09-19T10:00:00.000Z");
  });
});

describe("duplicate matching", () => {
  it("finds a nearby same-category semantic match", () => {
    const fields = extractDemoFields("The big water leak on Tamboti Road near the clinic is still flooding the road since yesterday.");
    const matches = findDuplicates(fields, seedReports);
    expect(matches[0]?.reference).toBe("FSA-2026-1842");
    expect(matches[0]?.score).toBeGreaterThanOrEqual(0.55);
    expect(matches[0]?.rationale.join(" ")).toContain("Same category");
  });

  it("does not treat a semantically similar report kilometres away as nearby", () => {
    const fields = extractDemoFields("A large water leak on New Road in Midrand is flooding the road.");
    expect(findDuplicates(fields, seedReports)).toHaveLength(0);
  });
});
