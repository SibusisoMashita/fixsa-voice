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
});
