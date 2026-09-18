"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { loadReports } from "@/lib/demo-store";
import { categoryLabels, type ServiceReport } from "@/lib/schemas";
import { PriorityBadge, StatusBadge } from "./Ui";

export function SuccessClient() {
  const search = useSearchParams();
  const reference = search.get("ref") || "FSA-2026-1842";
  const merged = search.get("merged") === "1";
  const [report, setReport] = useState<ServiceReport | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReport(loadReports().find((item) => item.reference === reference) || null));
    return () => window.cancelAnimationFrame(frame);
  }, [reference]);
  const copy = async () => { await navigator.clipboard?.writeText(reference); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const share = async () => {
    const data = { title: `FixSA Voice demo ${reference}`, text: `Track synthetic report ${reference}. This is a hackathon demo, not a municipal dispatch.`, url: `${window.location.origin}/track?ref=${reference}` };
    if (navigator.share) await navigator.share(data); else await navigator.clipboard?.writeText(`${data.text} ${data.url}`);
  };
  return <div className="narrow-container"><ol className="progress-steps" aria-label="Report progress"><li className="done">1 <span>Speak</span></li><li className="done">2 <span>Review</span></li><li className="done">3 <span>Confirm</span></li><li className="active">4 <span>Track</span></li></ol><section className="panel"><div className="success-hero"><div className="success-icon"><Check size={46}/></div><p className="eyebrow">{merged ? "Evidence merged" : "Demo report created"}</p><h1>{merged ? "Your evidence strengthened an existing report." : "Your report is ready to track."}</h1><p>This is a synthetic hackathon record. It has not been dispatched to a municipality or utility.</p><div className="reference-number">{reference}</div><div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}><button className="button button-ghost button-small" onClick={copy}><Copy size={16}/>{copied ? "Copied" : "Copy"}</button><button className="button button-ghost button-small" onClick={share}><Share2 size={16}/> Share</button><button className="button button-ghost button-small" onClick={() => window.print()}><Printer size={16}/> Print</button></div></div>
        {report && <dl className="detail-grid"><div><dt>Category</dt><dd>{categoryLabels[report.fields.category]}</dd></div><div><dt>Priority</dt><dd><PriorityBadge priority={report.priority}/></dd></div><div><dt>Status</dt><dd><StatusBadge status={report.status}/></dd></div><div><dt>Submitted</dt><dd>{new Date(report.createdAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</dd></div><div><dt>Location</dt><dd>{report.fields.location.address}</dd></div><div><dt>Expected SLA</dt><dd>{report.slaHours} hours · demo target</dd></div></dl>}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 26 }}><Link className="button button-primary" href={`/track?ref=${reference}`}>Track this report</Link><Link className="button button-ghost" href="/report">Report another issue</Link></div>
      </section></div>;
}
