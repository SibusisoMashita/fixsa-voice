"use client";

import { seedReports } from "./seed";
import type { ReportDraft, ServiceReport } from "./schemas";

const REPORTS_KEY = "fixsa:demo-reports:v2";
const LEGACY_REPORTS_KEY = "fixsa:demo-reports:v1";
const DRAFT_KEY = "fixsa:report-draft:v1";

export function loadReports(): ServiceReport[] {
  if (typeof window === "undefined") return seedReports;
  const stored = window.localStorage.getItem(REPORTS_KEY);
  if (!stored) return seedReports;
  try {
    return JSON.parse(stored) as ServiceReport[];
  } catch {
    return seedReports;
  }
}

export function saveReports(reports: ServiceReport[]) {
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event("fixsa:reports-updated"));
}

export function upsertReport(report: ServiceReport) {
  const reports = loadReports();
  saveReports([report, ...reports.filter((item) => item.id !== report.id && item.reference !== report.reference)]);
}

export function saveDraft(draft: ReportDraft) {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): ReportDraft | null {
  const stored = typeof window !== "undefined" ? window.sessionStorage.getItem(DRAFT_KEY) : null;
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ReportDraft;
  } catch {
    return null;
  }
}

export function resetDemoStore() {
  window.localStorage.removeItem(REPORTS_KEY);
  window.localStorage.removeItem(LEGACY_REPORTS_KEY);
  window.sessionStorage.removeItem(DRAFT_KEY);
  window.dispatchEvent(new Event("fixsa:reports-updated"));
}
