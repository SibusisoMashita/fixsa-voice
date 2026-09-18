import { describe, expect, it } from "vitest";
import { executeDemoTool } from "./voice-tools";

describe("voice tool integration contract", () => {
  it("classifies through the same tool contract used by the real adapter", () => {
    const result = executeDemoTool({ name:"classify_service_issue", arguments:{ transcript:"A large water leak is flooding Tamboti Road by the clinic." } });
    expect(result).toMatchObject({ mode:"demo", fields:{ category:"water_leak" } });
  });

  it("blocks creation without explicit confirmation", () => {
    const result = executeDemoTool({ name:"create_service_request", arguments:{ fields:{}, confirmation_received:false } });
    expect(result).toHaveProperty("error");
  });

  it("enforces the resident's latest spoken consent for state-changing tools", () => {
    const creation = executeDemoTool(
      { name:"create_service_request", arguments:{ fields:{}, confirmation_received:true } },
      undefined,
      { actor:"resident", latestResidentUtterance:"Yes, please create it", confirmationGranted:false, readbackRequested:false },
    );
    const merge = executeDemoTool(
      { name:"merge_with_existing_report", arguments:{ reference:"FSA-2026-1842", evidence_summary:"Same leak", confirmation_received:true } },
      undefined,
      { actor:"resident", latestResidentUtterance:"Please create a new report", confirmationGranted:true },
    );
    const update = executeDemoTool(
      { name:"update_report_status", arguments:{ reference:"FSA-2026-1842", status:"resolved", note:"Done" } },
      undefined,
      { actor:"resident", latestResidentUtterance:"Mark it resolved" },
    );
    expect(creation).toMatchObject({ error: expect.stringMatching(/confirmation is required/i) });
    expect(merge).toMatchObject({ error: expect.stringMatching(/did not explicitly choose/i) });
    expect(update).toMatchObject({ error: expect.stringMatching(/operator workspace/i) });
  });

  it("accepts an explicit yes after a spoken read-back checkpoint", () => {
    const classified = executeDemoTool({ name:"classify_service_issue", arguments:{ transcript:"A pothole on Church Street is making cars swerve." } }) as { fields: unknown };
    const result = executeDemoTool(
      { name:"create_service_request", arguments:{ fields:classified.fields, confirmation_received:true } },
      undefined,
      { actor:"resident", latestResidentUtterance:"Yes, that is right. Create the report.", confirmationGranted:false, readbackRequested:true },
    );
    expect(result).toMatchObject({ confirmation_source:"explicit_spoken_readback", status:"reported" });
  });

  it("blocks ordinary creation for immediate electricity danger", () => {
    const classified = executeDemoTool({ name:"classify_service_issue", arguments:{ transcript:"An exposed electrical cable is sparking beside the school." } }) as { fields: unknown };
    const result = executeDemoTool({ name:"create_service_request", arguments:{ fields: classified.fields, confirmation_received:true } });
    expect(result).toHaveProperty("error");
    expect(String((result as { error:string }).error)).toContain("safety hold");
  });

  it("validates status transitions", () => {
    const result = executeDemoTool({ name:"update_report_status", arguments:{ reference:"FSA-2026-1842", status:"closed", note:"Trying to skip stages" } });
    expect(result).toHaveProperty("error");
  });

  it("redacts evidence text", () => {
    const result = executeDemoTool({ name:"attach_evidence", arguments:{ reference:"FSA-2026-1842", note:"Call 082 123 4567 about the leak" } }) as { note:string };
    expect(result.note).toContain("[PHONE REDACTED]");
  });

  it("turns a disputed repair into a reopened Proof of Fix result", () => {
    const result = executeDemoTool({ name:"verify_resolution", arguments:{ reference:"FSA-2026-1811", outcome:"not_fixed", resident_statement:"The lights are still off." } });
    expect(result).toMatchObject({ verification_state:"disputed", status:"in_progress", reopened:true, synthetic:true });
  });

  it("blocks a resident Proof of Fix mutation before explicit read-back confirmation", () => {
    const result = executeDemoTool(
      { name:"verify_resolution", arguments:{ reference:"FSA-2026-1811", outcome:"fixed", resident_statement:"Both lights are working." } },
      undefined,
      { actor:"resident", latestResidentUtterance:"Both lights are working", confirmationGranted:false, readbackRequested:false },
    );
    expect(result).toMatchObject({ error: expect.stringMatching(/explicit confirmation/i) });
  });
});
