"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Database, LockKeyhole, PlugZap, RefreshCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { resetDemoStore } from "@/lib/demo-store";
import { fetchApiHealth, isApiConfigured } from "@/lib/api-client";

type Health = { status:string; service:string; version:string; database:string; time:string } | null;

export function SettingsClient() {
  const [health, setHealth] = useState<Health>(null);
  const [loading, setLoading] = useState(isApiConfigured);
  const [retainTranscript, setRetainTranscript] = useState(true);
  const [retainAudio, setRetainAudio] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isApiConfigured) return;
    fetchApiHealth().then(setHealth).catch(() => setHealth(null)).finally(() => setLoading(false));
  }, []);
  const reset = () => { resetDemoStore(); setMessage("Synthetic reports and drafts reset to the seed dataset in this browser."); };
  return <div className="settings-list"><section className="panel"><div className="panel-header"><div><p className="eyebrow">Integration health</p><h2>What is actually connected</h2></div><PlugZap/></div><div className="integration-card"><div className="integration-logo">API</div><div><strong>FixSA Laravel API</strong><p>{loading ? "Checking the protected API…" : health ? `${health.service} ${health.version} is healthy on ${health.database}.` : isApiConfigured ? "The configured API is unavailable; no server write will be attempted." : "No API URL is configured; deterministic browser-local mode is active."}</p></div><span className={`status-badge ${health ? "status-in_progress":"status-triaged"} integration-state`}>{loading ? "Checking" : health ? "Ready" : "Demo only"}</span></div><div className="integration-card" style={{ marginTop:12 }}><div className="integration-logo" style={{ background:"var(--paper-2)" }}><Database size={22}/></div><div><strong>Municipal work-order system</strong><p>Future placeholder. No endpoint, dispatch, or production data connection is configured.</p></div><span className="status-badge status-closed integration-state">Inactive</span></div></section>
    <div className="two-grid"><section className="panel"><div className="panel-header"><div><p className="eyebrow">Retention controls</p><h2>Minimum necessary data</h2></div><LockKeyhole/></div><div className="settings-list"><Setting title="Keep confirmed transcript" description="Stores the redacted text needed for the synthetic audit trail." value={retainTranscript} onChange={setRetainTranscript}/><Setting title="Retain voice audio" description="Off by design. Audio remains ephemeral unless an authorised policy changes it." value={retainAudio} onChange={setRetainAudio}/></div>{retainAudio && <div className="callout warning" style={{ marginTop:16 }}><ShieldCheck/><div><strong>Demo guardrail</strong><p>This UI preference does not store audio. A real operator would need a lawful, documented retention policy.</p></div></div>}</section><section className="panel"><div className="panel-header"><div><p className="eyebrow">Visibility policy</p><h2>Public vs private</h2></div><ShieldCheck/></div><h3>Public tracking</h3><p>Reference, category, approximate location, status timeline, SLA state, and public notes.</p><h3>Operator only</h3><p>Full transcript, internal notes, evidence metadata, assignment, duplicate rationale, and audit events.</p><h3>Never in public view</h3><p>Names, phone numbers, identity numbers, emails, and precise private-home detail.</p></section></div>
    <div className="two-grid"><section className="panel"><div className="panel-header"><div><p className="eyebrow">SLA rules</p><h2>Demo routing</h2></div><SlidersHorizontal/></div><dl className="detail-grid"><div><dt>Immediate danger</dt><dd>Safety hold</dd></div><div><dt>Urgent</dt><dd>4 hours</dd></div><div><dt>Priority</dt><dd>24 hours</dd></div><div><dt>Routine</dt><dd>72 hours</dd></div></dl><p style={{ marginTop:16 }}>Categories route to synthetic Water, Roads, Electricity, Sanitation, Lighting, Waste, or Public Assets teams.</p></section><section className="panel"><div className="panel-header"><div><p className="eyebrow">Demo reset</p><h2>Restore judge-ready data</h2></div><RefreshCcw/></div><p>Reset browser-local mutations, reversible merges, and draft state. No external system is changed.</p><button className="button button-ghost" onClick={reset}><RefreshCcw size={17}/> Reset synthetic data</button>{message && <p role="status"><CheckCircle2 size={16}/> {message}</p>}</section></div></div>;
}

function Setting({ title, description, value, onChange }: { title:string; description:string; value:boolean; onChange:(value:boolean)=>void }) { return <div className="setting-row"><div><strong>{title}</strong><p>{description}</p></div><button className="toggle" aria-label={title} aria-pressed={value} onClick={() => onChange(!value)}/></div>; }
