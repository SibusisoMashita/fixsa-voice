"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Edit3, GitMerge, ShieldCheck, Volume2 } from "lucide-react";
import { assignPriority, calculateSlaDue, extractDemoFields, makeReference, slaHoursFor } from "@/lib/domain";
import { loadDraft, loadReports, saveDraft, upsertReport } from "@/lib/demo-store";
import type { IssueCategory, ReportDraft, ServiceReport } from "@/lib/schemas";
import { categoryLabels, issueCategories } from "@/lib/schemas";

const fallbackText = "There is a large water leak near the clinic on Tamboti Road. It started yesterday and the road is flooding.";

export function ReviewClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<ReportDraft>(() => ({ id: "fallback-draft", source: "demo_scenario", rawTranscript: fallbackText, fields: extractDemoFields(fallbackText), duplicates: [], confirmed: false, safetyHold: false }));
  const [loaded, setLoaded] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [decision, setDecision] = useState<"merge" | "separate">("merge");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = loadDraft();
      if (stored) setDraft(stored);
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const readback = useMemo(() => {
    const { fields } = draft;
    return `${categoryLabels[fields.category]} at ${fields.location.address}, ${fields.location.area}, ${fields.duration.toLowerCase()}. Severity ${fields.severity}. ${fields.hazards.length ? `Hazards: ${fields.hazards.join(", ")}.` : "No specific hazard supplied."} ${fields.details}`;
  }, [draft]);

  const updateField = <K extends keyof ReportDraft["fields"]>(key: K, value: ReportDraft["fields"][K]) => {
    setDraft((current) => ({ ...current, fields: { ...current.fields, [key]: value }, confirmed: false }));
    setConfirmation(false);
  };

  const updateLocation = (key: "address" | "area" | "landmark", value: string) => {
    setDraft((current) => ({ ...current, fields: { ...current.fields, location: { ...current.fields.location, [key]: value, precision: "confirmed" } }, confirmed: false }));
    setConfirmation(false);
  };

  const speakReadback = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(`This is your FixSA Voice demo report. ${readback}. Is this correct?`));
    }
  };

  const submit = () => {
    if (!confirmation || draft.safetyHold) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const reports = loadReports();
    const duplicate = draft.duplicates[0];
    if (decision === "merge" && duplicate) {
      const existing = reports.find((report) => report.id === duplicate.reportId);
      if (existing) {
        upsertReport({
          ...existing,
          updatedAt: now,
          evidence: [...existing.evidence, { id: crypto.randomUUID(), type: "transcript", name: "Merged corroborating voice report", addedAt: now, public: false }],
          mergedReportIds: [...existing.mergedReportIds, draft.id],
          statusEvents: [...existing.statusEvents, { id: crypto.randomUUID(), status: existing.status, at: now, note: "Resident explicitly confirmed a reversible demo merge; corroborating evidence appended.", public: true, actor: "agent" }],
          publicNotes: [...existing.publicNotes, "Another resident corroborated this issue in the demo."],
        });
        saveDraft({ ...draft, confirmed: true });
        router.push(`/report/success?ref=${existing.reference}&merged=1`);
        return;
      }
    }
    const priority = assignPriority(draft.fields);
    const reference = makeReference(1948);
    const report: ServiceReport = {
      id: draft.id,
      reference,
      createdAt: now,
      updatedAt: now,
      source: draft.source,
      status: "reported",
      priority,
      fields: draft.fields,
      transcript: [
        { id: crypto.randomUUID(), speaker: "resident", text: draft.rawTranscript, timestamp: now, final: true },
        { id: crypto.randomUUID(), speaker: "agent", text: `Read back: ${readback}`, timestamp: now, final: true },
        { id: crypto.randomUUID(), speaker: "resident", text: "Yes, that is correct. Create the demo report.", timestamp: now, final: true },
      ],
      evidence: [{ id: crypto.randomUUID(), type: "transcript", name: "Confirmed report transcript", addedAt: now, public: false }],
      statusEvents: [{ id: crypto.randomUUID(), status: "reported", at: now, note: "Synthetic work order created after explicit resident confirmation.", public: true, actor: "agent" }],
      publicNotes: ["Report received by the FixSA Voice demo."],
      internalNotes: ["Synthetic hackathon record; not dispatched to a municipality."],
      assignee: null,
      slaHours: slaHoursFor(priority),
      slaDueAt: calculateSlaDue(now, priority),
      duplicateOf: null,
      mergedReportIds: [],
      audioRetention: "ephemeral_deleted",
      safetyHold: false,
      synthetic: true,
    };
    upsertReport(report);
    saveDraft({ ...draft, confirmed: true });
    router.push(`/report/success?ref=${reference}`);
  };

  if (!loaded) return <div className="panel">Loading the draft…</div>;

  return <div className="two-grid" style={{ alignItems: "start" }}>
    <section className="panel"><div className="panel-header"><div><p className="eyebrow">Extracted fields</p><h2>Check every detail</h2></div><Edit3/></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="category">Category</label><select id="category" value={draft.fields.category} onChange={(event) => updateField("category", event.target.value as IssueCategory)}>{issueCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></div>
        <div className="field"><label htmlFor="severity">Severity</label><select id="severity" value={draft.fields.severity} onChange={(event) => updateField("severity", event.target.value as ReportDraft["fields"]["severity"])}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></div>
        <div className="field field-full"><label htmlFor="address">Street or location</label><input id="address" value={draft.fields.location.address} onChange={(event) => updateLocation("address", event.target.value)}/></div>
        <div className="field"><label htmlFor="area">Area</label><input id="area" value={draft.fields.location.area} onChange={(event) => updateLocation("area", event.target.value)}/></div>
        <div className="field"><label htmlFor="landmark">Landmark</label><input id="landmark" value={draft.fields.location.landmark} onChange={(event) => updateLocation("landmark", event.target.value)}/></div>
        <div className="field"><label htmlFor="duration">Duration</label><input id="duration" value={draft.fields.duration} onChange={(event) => updateField("duration", event.target.value)}/></div>
        <div className="field"><label htmlFor="affected">People affected</label><input id="affected" type="number" min="0" value={draft.fields.peopleAffected} onChange={(event) => updateField("peopleAffected", Number(event.target.value))}/></div>
        <div className="field field-full"><label htmlFor="details">Supporting detail</label><textarea id="details" value={draft.fields.details} onChange={(event) => updateField("details", event.target.value)}/></div>
      </div>
      <div className="public-policy"><ShieldCheck size={16}/> Contact details and precise private-home information are not included in public tracking.</div>
    </section>

    <div className="settings-list">
      <section className="panel"><div className="panel-header"><div><p className="eyebrow">Duplicate check</p><h2>{draft.duplicates.length ? "A nearby report may match" : "No strong match found"}</h2></div><GitMerge/></div>
        {draft.duplicates.length ? draft.duplicates.slice(0, 2).map((match) => <article className="duplicate-card" key={match.reportId}><header><div><strong>{match.reference}</strong><p>{Math.round(match.distanceMeters)} m away · open report</p></div><span className="match-score">{Math.round(match.score * 100)}% match</span></header><ul>{match.rationale.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="mode-switch"><button aria-pressed={decision === "merge"} onClick={() => setDecision("merge")}>Merge evidence</button><button aria-pressed={decision === "separate"} onClick={() => setDecision("separate")}>Keep separate</button></div></article>) : <div className="callout"><Check/><div><strong>Clear to create</strong><p>No open synthetic report crossed the match threshold.</p></div></div>}
      </section>
      <section className="panel"><div className="panel-header"><div><p className="eyebrow">Required read-back</p><h2>Confirm the complete report</h2></div><Volume2/></div><div className="review-summary"><p>{readback}</p><strong>Is this correct?</strong></div><button className="button button-ghost button-wide" onClick={speakReadback}><Volume2 size={17}/> Hear read-back</button><label className="check-row" style={{ marginTop: 18 }}><input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)}/><span><strong>Yes, the read-back is correct</strong><br/><small>I explicitly confirm {decision === "merge" && draft.duplicates.length ? "merging my evidence into the matching demo report" : "creating this synthetic service request"}.</small></span></label><button className="button button-primary button-wide" disabled={!confirmation || submitting} onClick={submit} style={{ marginTop: 18 }}><Check size={18}/>{submitting ? "Creating…" : decision === "merge" && draft.duplicates.length ? "Confirm & merge evidence" : "Confirm & create demo report"}</button>
        {!confirmation && <p style={{ color: "var(--ink-soft)", fontSize: ".78rem", margin: "12px 0 0" }}><AlertCircle size={14}/> Creation stays blocked until explicit confirmation.</p>}
      </section>
    </div>
  </div>;
}
