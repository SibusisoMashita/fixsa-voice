"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircleWarning, Mic2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { applyResolutionVerification } from "@/lib/domain";
import { loadReports, upsertReport } from "@/lib/demo-store";
import { categoryLabels, type ResolutionOutcome, type ServiceReport } from "@/lib/schemas";
import { StatusBadge } from "./Ui";

const options: Array<{ outcome: ResolutionOutcome; label: string; statement: string; detail: string }> = [
  { outcome: "fixed", label: "Yes, it is fixed", statement: "Both streetlights are working again tonight.", detail: "Adds independent resident confirmation." },
  { outcome: "partially_fixed", label: "Only partly fixed", statement: "One streetlight is working, but the second light is still off.", detail: "Reopens the work order for follow-up." },
  { outcome: "not_fixed", label: "No, it is not fixed", statement: "The streetlights are still off and the area remains dark.", detail: "Disputes the closure and reopens it." },
];

export function ProofOfFixClient() {
  const search = useSearchParams();
  const reference = (search.get("ref") || "FSA-2026-1811").toUpperCase();
  const [report, setReport] = useState<ServiceReport | null>(null);
  const [selected, setSelected] = useState<ResolutionOutcome>("fixed");
  const [statement, setStatement] = useState(options[0].statement);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReport(loadReports().find((item) => item.reference === reference) || null));
    return () => window.cancelAnimationFrame(frame);
  }, [reference]);

  const choose = (outcome: ResolutionOutcome) => {
    const option = options.find((item) => item.outcome === outcome)!;
    setSelected(outcome);
    setStatement(option.statement);
    setError("");
  };

  const verify = () => {
    if (!report) return;
    try {
      const updated = applyResolutionVerification(report, selected, statement, "judge_demo");
      upsertReport(updated);
      setReport(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This fix could not be checked.");
    }
  };

  if (!report) return <div className="callout warning" role="alert"><MessageCircleWarning/><div><strong>Reference not found</strong><p>Use the judge-ready resolution reference FSA-2026-1811.</p></div></div>;

  const verification = report.resolutionVerification;
  const complete = verification && verification.state !== "pending";
  return <div className="settings-list">
    <section className="proof-hero">
      <div><p className="eyebrow">The accountability loop</p><h2>Trust is the product.</h2><p>A repair is not truly closed because a dashboard says so. FixSA asks the resident who experienced the issue.</p></div>
      <div className="proof-seal"><Sparkles/><strong>Proof<br/>of Fix</strong></div>
    </section>

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">Claimed resolution · {report.reference}</p><h2>{categoryLabels[report.fields.category]}</h2><p>{report.fields.location.address}, {report.fields.location.area}</p></div><StatusBadge status={report.status}/></div>
      <div className="callout"><ShieldCheck/><div><strong>What the synthetic crew says</strong><p>{report.statusEvents.findLast((event) => event.status === "resolved")?.note || "The work was marked resolved."}</p></div></div>
    </section>

    {!complete ? <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">Resident voice check</p><h2>Did the fix actually work?</h2></div><Mic2/></div>
      <div className="proof-options" role="radiogroup" aria-label="Resolution outcome">
        {options.map((option) => <button key={option.outcome} type="button" className={`proof-option ${selected === option.outcome ? "selected" : ""}`} role="radio" aria-checked={selected === option.outcome} onClick={() => choose(option.outcome)}><strong>{option.label}</strong><span>{option.detail}</span></button>)}
      </div>
      <div className="field" style={{ marginTop: 22 }}><label htmlFor="verification-statement">What the resident said</label><textarea id="verification-statement" value={statement} onChange={(event) => setStatement(event.target.value)} maxLength={500}/><small>Demo text stands in for the final AssemblyAI transcript. Audio is not stored.</small></div>
      <div className="proof-actions"><button className="button button-primary" onClick={verify} disabled={statement.trim().length < 3}><CheckCircle2 size={18}/> Confirm resident response</button><Link className="button button-secondary" href={`/report?mode=real&intent=verification&ref=${report.reference}`}><Mic2 size={18}/> Try with real voice</Link></div>
      {error && <p role="alert" className="error-text">{error}</p>}
    </section> : <section className={`proof-result ${verification.state === "verified" ? "verified" : "reopened"}`} aria-live="polite">
      <div className="proof-result-icon">{verification.state === "verified" ? <CheckCircle2/> : <RotateCcw/>}</div>
      <div><p className="eyebrow">Resident evidence recorded</p><h2>{verification.state === "verified" ? "Resolution independently confirmed." : "Closure challenged. Work order reopened."}</h2><p>“{verification.statement}”</p><p>The public timeline and operator audit trail now show the resident’s outcome without retaining their audio.</p><div className="proof-actions"><Link className="button button-secondary" href={`/track?ref=${report.reference}`}>See public proof</Link><Link className="button button-ghost" href={`/ops/reports/${report.id}`}>See operator audit</Link></div></div>
    </section>}
  </div>;
}
