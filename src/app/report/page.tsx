import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/Ui";
import { VoiceReportClient } from "@/components/VoiceReportClient";

export const metadata: Metadata = { title: "Report an issue", description: "Create a complete synthetic service report by voice or keyboard." };

export default function ReportPage() {
  return <div className="page-container"><PageHeader eyebrow="Resident reporting" title="Start with your voice." description="FixSA Voice listens in real time, asks only for missing details, checks nearby reports, and waits for your confirmation."/><Suspense fallback={<div className="panel">Preparing the voice workspace…</div>}><VoiceReportClient/></Suspense></div>;
}
