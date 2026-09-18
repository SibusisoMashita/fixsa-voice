import { categoryLabels, type DuplicateMatch, type ExtractedFields, type IssueCategory, type Priority, type ServiceReport } from "./schemas";

const categoryTerms: Record<IssueCategory, string[]> = {
  water_leak: ["water", "leak", "pipe", "burst", "flooding"],
  pothole: ["pothole", "hole", "road", "tyre", "swerve"],
  electricity_fault: ["electric", "electricity", "power", "wire", "cable", "transformer", "sparking"],
  sewer_overflow: ["sewer", "sewage", "wastewater", "manhole", "overflow"],
  broken_streetlight: ["streetlight", "street light", "lamp", "dark", "light is off"],
  illegal_dumping: ["dumping", "rubbish", "waste", "trash", "refuse"],
  damaged_public_asset: ["bench", "sign", "barrier", "public asset", "bus shelter", "playground"],
};

const safetyPatterns = [
  /\bfire\b/i,
  /\bflames?\b/i,
  /\bexplosion\b/i,
  /\bexposed\s+(wire|cable|electric)/i,
  /\b(sparking|electrocut)/i,
  /\bgas\s+(leak|smell)/i,
  /\b(severe|serious)\s+injur/i,
  /\bmedical emergency\b/i,
  /\bcrime\s+in\s+progress\b/i,
];

export function classifyIssue(text: string): IssueCategory {
  const normalized = text.toLowerCase();
  const scores = Object.entries(categoryTerms).map(([category, terms]) => ({
    category: category as IssueCategory,
    score: terms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].category : "damaged_public_asset";
}

export function detectImmediateDanger(text: string) {
  const matches = safetyPatterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return { requiresEmergencyGuidance: matches.length > 0, matches };
}

export function redactSensitiveText(text: string) {
  return text
    .replace(/\b\d{13}\b/g, "[SA ID REDACTED]")
    .replace(/\b(?:\+27|0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g, "[PHONE REDACTED]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL REDACTED]")
    .replace(/\b(?:unit|flat|house)\s+\d+[A-Za-z]?\b/gi, "[PRIVATE ADDRESS REDACTED]");
}

export function assignPriority(fields: ExtractedFields): Priority {
  if (fields.category === "electricity_fault" && /exposed|spark|fire|electrocut/i.test(`${fields.details} ${fields.hazards.join(" ")}`)) return "emergency_hold";
  if (fields.severity === "critical" || fields.hazards.some((hazard) => /health|flood|school|traffic/i.test(hazard))) return "urgent";
  if (fields.severity === "high" || fields.peopleAffected >= 50) return "priority";
  return "routine";
}

export function slaHoursFor(priority: Priority) {
  return { emergency_hold: 1, urgent: 4, priority: 24, routine: 72 }[priority];
}

export function calculateSlaDue(createdAt: string, priority: Priority) {
  return new Date(new Date(createdAt).getTime() + slaHoursFor(priority) * 3_600_000).toISOString();
}

export function haversineMeters(a: ExtractedFields["location"], b: ExtractedFields["location"]) {
  const radius = 6_371_000;
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(x));
}

function tokenSimilarity(a: string, b: string) {
  const clean = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((word) => word.length > 3));
  const aa = clean(a);
  const bb = clean(b);
  const intersection = [...aa].filter((word) => bb.has(word)).length;
  const union = new Set([...aa, ...bb]).size;
  return union ? intersection / union : 0;
}

export function findDuplicates(fields: ExtractedFields, reports: ServiceReport[]): DuplicateMatch[] {
  return reports
    .filter((report) => !["resolved", "closed"].includes(report.status))
    .map((report) => {
      const distanceMeters = haversineMeters(fields.location, report.fields.location);
      const categoryScore = fields.category === report.fields.category ? 0.5 : 0;
      const distanceScore = distanceMeters <= 150 ? 0.3 : distanceMeters <= 500 ? 0.18 : distanceMeters <= 1500 ? 0.05 : 0;
      const semanticScore = tokenSimilarity(fields.details, report.fields.details) * 0.2;
      const score = Math.min(1, categoryScore + distanceScore + semanticScore);
      const rationale = [
        ...(categoryScore ? [`Same category: ${categoryLabels[fields.category]}`] : []),
        ...(distanceMeters <= 1500 ? [`Approximately ${Math.round(distanceMeters)} m away`] : []),
        ...(semanticScore > 0.04 ? ["Overlapping description and hazard language"] : []),
        `Existing report is ${report.status.replace("_", " ")}`,
      ];
      return { reportId: report.id, reference: report.reference, score, distanceMeters: Math.round(distanceMeters), rationale };
    })
    .filter((match) => match.score >= 0.55 && match.distanceMeters <= 1500)
    .sort((a, b) => b.score - a.score);
}

export function makeReference(sequence = Math.floor(1000 + Math.random() * 8999)) {
  return `FSA-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
}

export function formatCategory(category: IssueCategory) {
  return categoryLabels[category];
}

export function extractDemoFields(text: string): ExtractedFields {
  const category = classifyIssue(text);
  const danger = detectImmediateDanger(text).requiresEmergencyGuidance;
  const area = /tamboti|clinic|ivory park/i.test(text) ? "Ivory Park" : /republic|randburg/i.test(text) ? "Randburg" : "Midrand";
  const suppliedStreet = text.match(/\b(?:on|at|along|in)\s+([A-Z][A-Za-z' -]{1,45}\s(?:Road|Street|Avenue|Drive|Lane))\b/i)?.[1];
  const address = /tamboti/i.test(text) ? "Tamboti Road" : /republic/i.test(text) ? "Republic Road" : suppliedStreet || "Location to be confirmed";
  return {
    category,
    location: {
      address,
      area,
      landmark: /clinic/i.test(text) ? "Local clinic" : /school/i.test(text) ? "School" : "Landmark not supplied",
      latitude: area === "Ivory Park" ? -25.9979 : area === "Randburg" ? -26.0991 : -25.9992,
      longitude: area === "Ivory Park" ? 28.1907 : area === "Randburg" ? 28.0067 : 28.1263,
      precision: address !== "Location to be confirmed" || /clinic|school/i.test(text) ? "confirmed" : "approximate",
    },
    duration: /yesterday/i.test(text) ? "Since yesterday" : /week/i.test(text) ? "About one week" : "Started recently",
    severity: danger ? "critical" : /large|flood|danger|deep|overflow/i.test(text) ? "high" : "moderate",
    hazards: danger ? ["Immediate danger indicated"] : /flood/i.test(text) ? ["Road flooding", "Slippery surface"] : /swerve|deep/i.test(text) ? ["Vehicles swerving"] : [],
    peopleAffected: /clinic|school|road/i.test(text) ? 50 : 10,
    details: redactSensitiveText(text),
  };
}
