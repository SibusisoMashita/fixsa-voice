import { slaHoursFor } from "./domain";
import type { Priority, ReportDraft, ResolutionOutcome, ServiceReport } from "./schemas";

const baseUrl = (process.env.NEXT_PUBLIC_FIXSA_API_BASE_URL || "").replace(/\/$/, "");

export const isApiConfigured = baseUrl.length > 0;

export function apiUrl(path: string) {
  return `${baseUrl}${path}`;
}

type ApiEnvelope<T> = { data: T };

function normalizeReport(input: Partial<ServiceReport> & Pick<ServiceReport, "id" | "reference" | "status" | "priority" | "fields">): ServiceReport {
  const createdAt = input.createdAt || new Date().toISOString();
  const slaHours = slaHoursFor(input.priority);
  return {
    id: input.id,
    reference: input.reference,
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    source: input.source || "text",
    status: input.status,
    priority: input.priority,
    fields: input.fields,
    transcript: input.transcript || [],
    evidence: input.evidence || [],
    statusEvents: input.statusEvents || [],
    publicNotes: input.publicNotes || [],
    internalNotes: input.internalNotes || [],
    assignee: input.assignee || null,
    slaHours,
    slaDueAt: input.slaDueAt || new Date(new Date(createdAt).getTime() + slaHours * 3_600_000).toISOString(),
    duplicateOf: input.duplicateOf || null,
    mergedReportIds: input.mergedReportIds || [],
    audioRetention: input.audioRetention || "not_recorded",
    safetyHold: input.safetyHold || false,
    resolutionVerification: input.resolutionVerification || undefined,
    synthetic: true,
  };
}

async function json<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || body.error || "The FixSA API request failed.");
  return body as T;
}

export async function fetchPublicReport(reference: string): Promise<ServiceReport | null> {
  const response = await fetch(apiUrl(`/api/v1/reports/${encodeURIComponent(reference)}`), { cache: "no-store" });
  if (response.status === 404) return null;
  const result = await json<ApiEnvelope<ServiceReport>>(response);
  return normalizeReport(result.data);
}

export async function createPublicReport(draft: ReportDraft, priority: Priority, readback: string): Promise<ServiceReport> {
  const now = new Date().toISOString();
  const response = await fetch(apiUrl("/api/v1/reports"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": `draft-${draft.id}` },
    body: JSON.stringify({
      source: draft.source,
      category: draft.fields.category,
      priority,
      severity: draft.fields.severity,
      details: draft.fields.details,
      duration: draft.fields.duration,
      hazards: draft.fields.hazards,
      people_affected: draft.fields.peopleAffected,
      safety_hold: draft.safetyHold,
      synthetic: true,
      language: "en-ZA",
      channel: "web",
      location: draft.fields.location,
      transcript: [
        { speaker: "resident", text: draft.rawTranscript, timestamp: now, final: true },
        { speaker: "agent", text: `Read back: ${readback}`, timestamp: now, final: true },
        { speaker: "resident", text: "Yes, that is correct. Create the demo report.", timestamp: now, final: true },
      ],
    }),
  });
  const result = await json<ApiEnvelope<ServiceReport>>(response);
  return normalizeReport(result.data);
}

export async function verifyRemoteResolution(reference: string, outcome: ResolutionOutcome, statement: string, method: "voice" | "text" | "judge_demo") {
  const response = await fetch(apiUrl(`/api/v1/reports/${encodeURIComponent(reference)}/verify-resolution`), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ outcome, statement, method }),
  });
  const result = await json<ApiEnvelope<ServiceReport>>(response);
  return normalizeReport(result.data);
}

export async function fetchApiHealth() {
  return json<{ status: string; service: string; version: string; database: string; time: string }>(
    await fetch(apiUrl("/api/v1/health"), { cache: "no-store" }),
  );
}
