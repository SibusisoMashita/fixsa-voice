"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, BadgeCheck, FilePlus2, MapPin, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { loadReports, upsertReport } from "@/lib/demo-store";
import { reportStatuses, statusLabels, categoryLabels, type ServiceReport } from "@/lib/schemas";
import { MapPanel } from "./MapPanel";
import { PriorityBadge, StatusBadge } from "./Ui";

type LookupState = "idle" | "found" | "missing" | "expired";

export function TrackClient() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";
  const [reference, setReference] = useState(initialRef);
  const [report, setReport] = useState<ServiceReport | null>(null);
  const [state, setState] = useState<LookupState>("idle");
  const [note, setNote] = useState("");
  const [evidenceMessage, setEvidenceMessage] = useState("");

  const lookup = (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (/^FSA-20(2[0-5]|1\d)-/.test(normalized)) { setReport(null); setState("expired"); return; }
    const found = loadReports().find((item) => item.reference === normalized) || null;
    setReport(found);
    setState(found ? "found" : "missing");
  };

  useEffect(() => {
    if (!initialRef) return;
    const frame = window.requestAnimationFrame(() => lookup(initialRef));
    return () => window.cancelAnimationFrame(frame);
  }, [initialRef]);
  const submit = (event: FormEvent) => { event.preventDefault(); lookup(reference); };
  const addEvidence = () => {
    if (!report || note.trim().length < 3) return;
    const updated = { ...report, evidence: [...report.evidence, { id: crypto.randomUUID(), type: "note" as const, name: note.trim(), addedAt: new Date().toISOString(), public: false }], updatedAt: new Date().toISOString() };
    upsertReport(updated);
    setReport(updated);
    setNote("");
    setEvidenceMessage("Follow-up note attached in this browser. It is private to the demo operator view.");
  };

  const currentIndex = report ? reportStatuses.indexOf(report.status) : -1;
  return <>
    <form className="panel" onSubmit={submit}><div className="field"><label htmlFor="tracking-ref">FixSA Voice reference number</label><div style={{ display: "flex", gap: 10 }}><input id="tracking-ref" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="FSA-2026-1842" autoComplete="off"/><button className="button button-secondary" type="submit"><Search size={18}/> Look up</button></div><small>Try the judge-ready reference FSA-2026-1842.</small></div></form>

    {state === "idle" && <div className="empty-state"><div className="empty-orb">?</div><h2>Enter a reference to begin.</h2><p>Your public view never includes contact details, internal notes, or precise private-home data.</p></div>}
    {state === "missing" && <div className="callout warning tracking-result" role="alert"><AlertCircle/><div><strong>Reference not found</strong><p>Check every character and try again. Demo references use the format FSA-2026-1234. This may also be a reference from another service.</p></div></div>}
    {state === "expired" && <div className="callout warning tracking-result" role="alert"><AlertCircle/><div><strong>Reference is outside this demo period</strong><p>This local demonstration only contains 2026 synthetic records. No archival municipal records are connected.</p></div></div>}
    {report && <div className="tracking-result settings-list">
      <section className="panel"><div className="panel-header"><div><p className="eyebrow">{report.reference}</p><h2>{categoryLabels[report.fields.category]}</h2><p>{report.fields.location.address}, {report.fields.location.area}</p></div><div style={{ display: "grid", gap: 7, justifyItems: "end" }}><StatusBadge status={report.status}/><PriorityBadge priority={report.priority}/></div></div><div className="callout"><ShieldCheck/><div><strong>Synthetic tracking view</strong><p>This status reflects browser-local demo data, not a municipal system. Last updated {new Date(report.updatedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}.</p></div></div>
        <ol className="timeline">{reportStatuses.map((status, index) => { const event = report.statusEvents.findLast((item) => item.status === status && item.public); return <li key={status} className={index <= currentIndex ? "complete" : ""}><strong>{statusLabels[status]}</strong>{event ? <><p>{event.note}</p><time>{new Date(event.at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</time></> : <p>Awaiting this stage</p>}</li>; })}</ol>
        {report.resolutionVerification && <div className={`proof-public ${report.resolutionVerification.state}`}>
          {report.resolutionVerification.state === "pending" ? <ShieldCheck/> : report.resolutionVerification.state === "verified" ? <BadgeCheck/> : <RotateCcw/>}
          <div><strong>{report.resolutionVerification.state === "pending" ? "Awaiting resident Proof of Fix" : report.resolutionVerification.state === "verified" ? "Resolution independently confirmed" : "Resident challenged the closure"}</strong><p>{report.resolutionVerification.state === "pending" ? "The crew marked this resolved, but closure is not yet resident-verified." : report.resolutionVerification.statement}</p>{report.resolutionVerification.state === "pending" && <Link className="button button-primary button-small" href={`/verify?ref=${report.reference}`}>Verify this repair</Link>}</div>
        </div>}
      </section>
      <div className="two-grid"><section className="panel"><div className="panel-header"><div><p className="eyebrow">Approximate location</p><h2>Public map</h2></div><MapPin/></div><MapPanel reports={[report]}/></section><section className="panel"><div className="panel-header"><div><p className="eyebrow">Resident follow-up</p><h2>Add non-sensitive evidence</h2></div><FilePlus2/></div><p>Do not include names, phone numbers, identity numbers, email addresses, or private-home detail.</p><div className="field"><label htmlFor="followup-note">Follow-up note</label><textarea id="followup-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. The leak is now crossing both lanes." maxLength={500}/></div><label className="button button-ghost button-wide" style={{ marginTop: 10 }}><FilePlus2 size={17}/> Choose photo<input type="file" accept="image/*" hidden onChange={(event) => event.target.files?.[0] && setEvidenceMessage(`${event.target.files[0].name} selected. Demo files are not uploaded.`)}/></label><button className="button button-primary button-wide" style={{ marginTop: 10 }} onClick={addEvidence} disabled={note.trim().length < 3}>Attach demo note</button>{evidenceMessage && <p role="status" style={{ marginTop: 12 }}>{evidenceMessage}</p>}</section></div>
    </div>}
  </>;
}
