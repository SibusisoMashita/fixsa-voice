"use client";

import { useState } from "react";
import { Check, GitMerge, RotateCcw, Split } from "lucide-react";
import { categoryLabels } from "@/lib/schemas";
import { seedReports } from "@/lib/seed";
import { MapPanel } from "./MapPanel";

const primary = seedReports[0];

export function DuplicateReviewClient() {
  const [decision, setDecision] = useState<"pending"|"merged"|"separate">("pending");
  const [history, setHistory] = useState<string[]>(["10:04 · Similarity service flagged a likely duplicate", "10:05 · Evidence and distance rationale generated"]);
  const decide = (next: "merged"|"separate") => { setDecision(next); setHistory((items) => [...items, `${new Date().toLocaleTimeString("en-ZA", { hour:"2-digit", minute:"2-digit" })} · Demo operator chose ${next === "merged" ? "merge" : "keep separate"}`]); };
  const undo = () => { setDecision("pending"); setHistory((items) => [...items, `${new Date().toLocaleTimeString("en-ZA", { hour:"2-digit", minute:"2-digit" })} · Decision reversed; pair returned to review`]); };
  return <div className="settings-list"><section className="panel"><div className="panel-header"><div><p className="eyebrow">Candidate pair · 88% match</p><h2>Same water leak, or two incidents?</h2></div><GitMerge/></div><div className="comparison-grid"><CompareCard label="Existing report" reference={primary.reference} transcript="There is a large water leak near the clinic on Tamboti Road. The road is flooding." date="18 Sep · 07:42"/><div className="compare-vs">VS</div><CompareCard label="New evidence" reference="Draft voice report" transcript="The big water leak on Tamboti Road near the clinic is still flooding the road." date="18 Sep · 10:03"/></div><div className="callout" style={{ marginTop:20 }}><Check/><div><strong>Why it matched</strong><p>Same category, approximately 34 metres apart, shared “Tamboti Road / clinic / flooding” language, and overlapping time window.</p></div></div></section>
    <section className="panel"><div className="panel-header"><div><p className="eyebrow">Distance context</p><h2>Reports on the map</h2></div><span className="match-score">34 m</span></div><MapPanel reports={[primary, { ...primary, id:"candidate", reference:"FSA-2026-1948", fields:{ ...primary.fields, location:{ ...primary.fields.location, latitude: primary.fields.location.latitude + .00025, longitude: primary.fields.location.longitude + .00018 } } }]}/></section>
    <div className="two-grid"><section className="panel"><p className="eyebrow">Operator decision</p><h2>{decision === "pending" ? "Review required" : decision === "merged" ? "Evidence merged" : "Kept as separate reports"}</h2><p>{decision === "merged" ? "The new transcript and observation are appended to the existing incident. The new resident would track the existing reference." : decision === "separate" ? "Both synthetic reports remain independently trackable." : "A merge preserves both original transcripts and adds an audit event."}</p>{decision === "pending" ? <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}><button className="button button-primary" onClick={() => decide("merged")}><GitMerge size={17}/> Merge evidence</button><button className="button button-ghost" onClick={() => decide("separate")}><Split size={17}/> Keep separate</button></div> : <button className="button button-ghost" onClick={undo}><RotateCcw size={17}/> Reverse decision</button>}</section><section className="panel"><p className="eyebrow">Audit trail</p><h2>Decision history</h2><ul className="audit-list">{[...history].reverse().map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section></div>
  </div>;
}

function CompareCard({ label, reference, transcript, date }: { label:string; reference:string; transcript:string; date:string }) { return <article className="compare-card"><p className="eyebrow">{label}</p><h3>{reference}</h3><ul className="compare-list"><li><strong>Category:</strong> {categoryLabels.water_leak}</li><li><strong>Location:</strong> Tamboti Road near clinic</li><li><strong>Reported:</strong> {date}</li><li><strong>Status:</strong> Open</li></ul><div className="transcript-bubble">“{transcript}”</div></article>; }
