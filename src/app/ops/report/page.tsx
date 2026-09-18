import { Suspense } from "react";
import { ReportDetailEntry } from "@/components/ReportDetailClient";

export default function ReportDetailPage() {
  return <Suspense fallback={<div className="panel">Loading report…</div>}><ReportDetailEntry/></Suspense>;
}
