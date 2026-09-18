import { z } from "zod";

export const issueCategories = [
  "water_leak",
  "pothole",
  "electricity_fault",
  "sewer_overflow",
  "broken_streetlight",
  "illegal_dumping",
  "damaged_public_asset",
] as const;

export const reportStatuses = [
  "reported",
  "triaged",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const priorities = ["routine", "priority", "urgent", "emergency_hold"] as const;

export const locationSchema = z.object({
  address: z.string().min(3),
  area: z.string().min(2),
  landmark: z.string().optional().default(""),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  precision: z.enum(["approximate", "confirmed"]).default("approximate"),
});

export const extractedFieldsSchema = z.object({
  category: z.enum(issueCategories),
  location: locationSchema,
  duration: z.string().min(1),
  severity: z.enum(["low", "moderate", "high", "critical"]),
  hazards: z.array(z.string()).default([]),
  peopleAffected: z.number().int().min(0).default(0),
  details: z.string().min(10),
});

export const transcriptSegmentSchema = z.object({
  id: z.string(),
  speaker: z.enum(["resident", "agent", "system"]),
  text: z.string(),
  timestamp: z.string(),
  final: z.boolean(),
});

export const evidenceSchema = z.object({
  id: z.string(),
  type: z.enum(["photo", "note", "transcript"]),
  name: z.string(),
  addedAt: z.string(),
  public: z.boolean().default(false),
});

export const statusEventSchema = z.object({
  id: z.string(),
  status: z.enum(reportStatuses),
  at: z.string(),
  note: z.string(),
  public: z.boolean(),
  actor: z.enum(["resident", "agent", "operator", "system"]),
});

export const duplicateMatchSchema = z.object({
  reportId: z.string(),
  reference: z.string(),
  score: z.number().min(0).max(1),
  distanceMeters: z.number().min(0),
  rationale: z.array(z.string()),
});

export const serviceReportSchema = z.object({
  id: z.string(),
  reference: z.string().regex(/^FSA-\d{4}-\d{4}$/),
  createdAt: z.string(),
  updatedAt: z.string(),
  source: z.enum(["voice", "text", "demo_scenario"]),
  status: z.enum(reportStatuses),
  priority: z.enum(priorities),
  fields: extractedFieldsSchema,
  transcript: z.array(transcriptSegmentSchema),
  evidence: z.array(evidenceSchema),
  statusEvents: z.array(statusEventSchema),
  publicNotes: z.array(z.string()),
  internalNotes: z.array(z.string()),
  assignee: z.string().nullable(),
  slaHours: z.number().positive(),
  slaDueAt: z.string(),
  duplicateOf: z.string().nullable(),
  mergedReportIds: z.array(z.string()),
  audioRetention: z.enum(["not_recorded", "ephemeral_deleted", "session_only"]),
  safetyHold: z.boolean(),
  synthetic: z.literal(true),
});

export const reportDraftSchema = z.object({
  id: z.string(),
  source: z.enum(["voice", "text", "demo_scenario"]),
  rawTranscript: z.string().min(10),
  fields: extractedFieldsSchema,
  duplicates: z.array(duplicateMatchSchema),
  confirmed: z.boolean().default(false),
  safetyHold: z.boolean().default(false),
});

export const toolNameSchema = z.enum([
  "search_nearby_reports",
  "classify_service_issue",
  "confirm_report_details",
  "create_service_request",
  "merge_with_existing_report",
  "attach_evidence",
  "get_report_status",
  "update_report_status",
]);

export type IssueCategory = (typeof issueCategories)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type Priority = (typeof priorities)[number];
export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;
export type ServiceReport = z.infer<typeof serviceReportSchema>;
export type ReportDraft = z.infer<typeof reportDraftSchema>;
export type DuplicateMatch = z.infer<typeof duplicateMatchSchema>;
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

export const categoryLabels: Record<IssueCategory, string> = {
  water_leak: "Water leak",
  pothole: "Pothole",
  electricity_fault: "Electricity fault",
  sewer_overflow: "Sewer overflow",
  broken_streetlight: "Broken streetlight",
  illegal_dumping: "Illegal dumping",
  damaged_public_asset: "Damaged public asset",
};

export const statusLabels: Record<ReportStatus, string> = {
  reported: "Reported",
  triaged: "Triaged",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
