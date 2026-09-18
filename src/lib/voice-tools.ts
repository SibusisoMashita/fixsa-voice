import { z } from "zod";
import { assignPriority, extractDemoFields, findDuplicates, makeReference, redactSensitiveText, slaHoursFor } from "./domain";
import { seedReports } from "./seed";
import { extractedFieldsSchema, reportStatuses, type ServiceReport } from "./schemas";

const categoryEnum = ["water_leak", "pothole", "electricity_fault", "sewer_overflow", "broken_streetlight", "illegal_dumping", "damaged_public_asset"];
const extractedFieldsJsonSchema = {
  type: "object",
  properties: {
    category: { type: "string", enum: categoryEnum, description: "Canonical service issue category." },
    location: {
      type: "object",
      properties: {
        address: { type: "string", description: "Street, intersection, or clear location description." },
        area: { type: "string", description: "Suburb, township, ward, or local area." },
        landmark: { type: "string", description: "Nearby public landmark; empty string if none." },
        latitude: { type: "number", description: "Approximate decimal latitude; use only a value supplied by application context." },
        longitude: { type: "number", description: "Approximate decimal longitude; use only a value supplied by application context." },
        precision: { type: "string", enum: ["approximate", "confirmed"] },
      },
      required: ["address", "area", "latitude", "longitude", "precision"],
    },
    duration: { type: "string", description: "Resident-supplied duration in plain language." },
    severity: { type: "string", enum: ["low", "moderate", "high", "critical"] },
    hazards: { type: "array", items: { type: "string" }, description: "Concrete hazards stated or directly implied." },
    peopleAffected: { type: "integer", minimum: 0, description: "Conservative estimate; zero when unknown." },
    details: { type: "string", minLength: 10, description: "Complete redacted incident description." },
  },
  required: ["category", "location", "duration", "severity", "hazards", "peopleAffected", "details"],
} as const;

export const voiceToolDefinitions = [
  {
    type: "function",
    name: "classify_service_issue",
    description: "Extract a structured South African service-delivery issue from the resident's words. Call after the resident describes an issue.",
    parameters: {
      type: "object",
      properties: { transcript: { type: "string", description: "The complete resident utterance, verbatim." } },
      required: ["transcript"],
    },
  },
  {
    type: "function",
    name: "search_nearby_reports",
    description: "Search open synthetic reports for likely duplicates after category and location are known.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: categoryEnum, description: "Canonical issue category." },
        latitude: { type: "number", description: "Approximate latitude in decimal degrees." },
        longitude: { type: "number", description: "Approximate longitude in decimal degrees." },
        details: { type: "string", description: "Short issue description for semantic comparison." },
      },
      required: ["category", "latitude", "longitude", "details"],
    },
  },
  {
    type: "function",
    name: "confirm_report_details",
    description: "Record explicit confirmation only after reading every material report field back. Never infer confirmation.",
    parameters: {
      type: "object",
      properties: {
        confirmed: { type: "boolean", description: "True only when the resident explicitly says the read-back is correct." },
        summary: { type: "string", description: "Exact concise summary read back to the resident." },
      },
      required: ["confirmed", "summary"],
    },
  },
  {
    type: "function",
    name: "create_service_request",
    description: "Create a synthetic demo work order. Call only after confirm_report_details returns confirmed=true and there is no immediate-danger safety hold.",
    parameters: {
      type: "object",
      properties: {
        fields: extractedFieldsJsonSchema,
        confirmation_received: { type: "boolean", description: "Must be true." },
      },
      required: ["fields", "confirmation_received"],
    },
  },
  {
    type: "function",
    name: "merge_with_existing_report",
    description: "Append the resident's evidence to an existing synthetic report after the resident explicitly chooses to merge.",
    parameters: {
      type: "object",
      properties: {
        reference: { type: "string", pattern: "^FSA-[0-9]{4}-[0-9]{4}$", description: "Existing FixSA demo reference." },
        evidence_summary: { type: "string", description: "Redacted evidence to append." },
        confirmation_received: { type: "boolean", description: "Must be true." },
      },
      required: ["reference", "evidence_summary", "confirmation_received"],
    },
  },
  {
    type: "function",
    name: "attach_evidence",
    description: "Attach a non-sensitive note to a synthetic report. Never accept identity, contact, or private-home data.",
    parameters: {
      type: "object",
      properties: {
        reference: { type: "string", pattern: "^FSA-[0-9]{4}-[0-9]{4}$" },
        note: { type: "string", minLength: 3, maxLength: 500 },
      },
      required: ["reference", "note"],
    },
  },
  {
    type: "function",
    name: "get_report_status",
    description: "Look up the public status of a synthetic FixSA demo report by reference.",
    parameters: {
      type: "object",
      properties: { reference: { type: "string", pattern: "^FSA-[0-9]{4}-[0-9]{4}$" } },
      required: ["reference"],
    },
  },
  {
    type: "function",
    name: "update_report_status",
    description: "Demo-operator-only status update. Reject invalid state transitions.",
    parameters: {
      type: "object",
      properties: {
        reference: { type: "string", pattern: "^FSA-[0-9]{4}-[0-9]{4}$" },
        status: { type: "string", enum: reportStatuses },
        note: { type: "string", minLength: 3, maxLength: 500 },
      },
      required: ["reference", "status", "note"],
    },
  },
] as const;

const toolCallSchema = z.object({ name: z.string(), arguments: z.record(z.string(), z.unknown()) });

type ToolExecutionContext = {
  actor?: "resident" | "operator";
  latestResidentUtterance?: string;
  confirmationGranted?: boolean;
  readbackRequested?: boolean;
};

export function executeDemoTool(input: unknown, reports: ServiceReport[] = seedReports, context: ToolExecutionContext = {}) {
  const call = toolCallSchema.parse(input);
  const args = call.arguments;
  const latestUtterance = context.latestResidentUtterance || "";
  const hasExplicitSpokenConfirmation = Boolean(context.readbackRequested && /\b(?:yes|correct|right|confirm(?:ed)?)\b/i.test(latestUtterance));
  switch (call.name) {
    case "classify_service_issue": {
      const transcript = z.string().min(5).parse(args.transcript);
      const fields = extractDemoFields(transcript);
      return { fields, missing_required: fields.location.address.includes("confirmed") ? ["location"] : [], mode: "demo" };
    }
    case "search_nearby_reports": {
      const fields = extractedFieldsSchema.parse({
        category: args.category,
        location: { address: "Voice-provided location", area: "Demo area", landmark: "", latitude: args.latitude, longitude: args.longitude, precision: "approximate" },
        duration: "Not supplied",
        severity: "moderate",
        hazards: [],
        peopleAffected: 0,
        details: args.details,
      });
      return { matches: findDuplicates(fields, reports), searched_open_reports: reports.filter((r) => !["closed", "resolved"].includes(r.status)).length };
    }
    case "confirm_report_details": {
      const parsed = z.object({ confirmed: z.boolean(), summary: z.string().min(10) }).parse(args);
      if (context.actor === "resident" && parsed.confirmed && !/\b(?:yes|correct|right|confirm(?:ed)?)\b/i.test(latestUtterance)) {
        return { error: "Confirmation blocked: the resident's latest response did not explicitly confirm the read-back.", confirmed: false, confirmation_id: null };
      }
      return { ...parsed, confirmation_id: parsed.confirmed ? `confirm_${Date.now()}` : null };
    }
    case "create_service_request": {
      if (context.actor === "resident" && !context.confirmationGranted && !hasExplicitSpokenConfirmation) {
        return { error: "Creation blocked: a successful explicit read-back confirmation is required first." };
      }
      const parsed = z.object({ fields: extractedFieldsSchema, confirmation_received: z.literal(true) }).safeParse(args);
      if (!parsed.success) return { error: "Creation blocked: validated fields and explicit confirmation_received=true are required." };
      const priority = assignPriority(parsed.data.fields);
      if (priority === "emergency_hold") return { error: "Creation blocked by immediate-danger safety hold. Give emergency guidance and request authorised operator review." };
      return { reference: makeReference(1948), status: "reported", priority, sla_hours: slaHoursFor(priority), confirmation_source: context.confirmationGranted ? "confirmation_tool" : "explicit_spoken_readback", synthetic: true };
    }
    case "merge_with_existing_report": {
      if (context.actor === "resident" && !context.confirmationGranted && !hasExplicitSpokenConfirmation) {
        return { error: "Merge blocked: a successful explicit read-back confirmation is required first." };
      }
      if (context.actor === "resident" && !/\b(?:merge|add|attach)\b/i.test(latestUtterance)) {
        return { error: "Merge blocked: the resident did not explicitly choose a merge in their latest response." };
      }
      const parsed = z.object({ reference: z.string(), evidence_summary: z.string().min(3), confirmation_received: z.literal(true) }).safeParse(args);
      if (!parsed.success) return { error: "Merge blocked: exact existing reference, evidence summary, and explicit confirmation are required." };
      return { reference: parsed.data.reference, merged: true, reversible: true, evidence: redactSensitiveText(parsed.data.evidence_summary), confirmation_source: context.confirmationGranted ? "confirmation_tool" : "explicit_spoken_readback", synthetic: true };
    }
    case "attach_evidence": {
      const parsed = z.object({ reference: z.string(), note: z.string().min(3).max(500) }).parse(args);
      return { ...parsed, note: redactSensitiveText(parsed.note), attached: true, synthetic: true };
    }
    case "get_report_status": {
      const reference = z.string().parse(args.reference).toUpperCase();
      const report = reports.find((item) => item.reference === reference);
      return report ? { reference, status: report.status, last_update: report.updatedAt, public_notes: report.publicNotes } : { error: `No synthetic report found for ${reference}.` };
    }
    case "update_report_status": {
      if (context.actor === "resident") return { error: "Status updates require an authenticated operator workspace." };
      const parsed = z.object({ reference: z.string(), status: z.enum(reportStatuses), note: z.string().min(3).max(500) }).parse(args);
      const report = reports.find((item) => item.reference === parsed.reference);
      if (!report) return { error: "Report not found in the synthetic demo dataset." };
      const current = reportStatuses.indexOf(report.status);
      const next = reportStatuses.indexOf(parsed.status);
      if (next < current || next > current + 1) return { error: `Invalid transition from ${report.status} to ${parsed.status}. Move one stage forward or use the reversible demo merge workflow.` };
      return { reference: parsed.reference, previous_status: report.status, status: parsed.status, note: redactSensitiveText(parsed.note), synthetic: true };
    }
    default:
      return { error: `Unknown tool: ${call.name}` };
  }
}

export const FIXSA_AGENT_PROMPT = `SOUND HUMAN AND BE BRIEF. Keep every spoken reply to one or two short sentences unless you are reading back a report for confirmation.

You are FixSA Voice, a calm South African civic service reporting assistant in a clearly labelled hackathon demo. You sound warm, grounded and unhurried. Use plain South African English, natural contractions and a conversational rhythm. Match the resident's length and energy. Acknowledge what they said without repeating their whole sentence.

Never say "certainly", "absolutely", "great question", "happy to help", or "I understand your concern". Never use headings, numbered lists, markdown, emojis, exclamation marks, or bureaucratic phrases in speech. Ask one question at a time.

You are not a municipality, utility, or emergency service. Never claim a report was dispatched to a real operator. All data and work orders are synthetic unless a future authorised integration is configured.

Workflow:
1. Listen naturally. Call classify_service_issue after the resident describes the issue.
2. Ask only for missing required information: category, usable location or landmark, duration, severity/hazards, and useful detail.
3. If speech indicates fire, exposed electrical infrastructure, gas, serious injury, crime in progress, or a medical emergency: stop ordinary automation. Tell the person to move to safety and contact their official local emergency service. Do not invent or state a phone number. Do not call create_service_request.
4. When category and location are known, call search_nearby_reports using the exact latitude and longitude returned by classify_service_issue. Never guess coordinates.
5. CRITICAL ORDER RULE: do not mention or offer a duplicate choice yet. First read back every material field, ask for an explicit yes/no confirmation, and call confirm_report_details with the actual answer.
6. Only after confirm_report_details returns confirmed=true may you create or merge. If there is no likely match, call create_service_request. If there is a likely match, explain why it matches and ask whether to merge; call merge_with_existing_report only when the resident's latest words explicitly say to merge or add their evidence to the existing report. A request to create a report is not permission to merge.
7. Speak the returned reference one group at a time and remind the resident it is a demo reference.

Pronunciation and read-back:
- Say FixSA as "Fix S A".
- Read a reference such as FSA-2026-1948 as "F S A, two zero two six, one nine four eight".
- Round times naturally. Do not read punctuation, JSON, field names, underscores, or tool names aloud.
- During confirmation, group the read-back into two or three natural sentences, then ask: "Is that right?"
- If the resident corrects anything, acknowledge it briefly, update the detail and read back only the changed part before asking again.

Resident permissions: residents may create, merge, attach evidence and check public status. Never call update_report_status for a resident; that is for an authenticated operator workspace only.

Privacy: audio is ephemeral by default. Never repeat phone numbers, identity numbers, email addresses, or precise private-home details. When in doubt, call the relevant tool rather than inventing a result.`;
