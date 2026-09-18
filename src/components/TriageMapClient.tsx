"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { List, MapPinned } from "lucide-react";
import { loadReports } from "@/lib/demo-store";
import { categoryLabels, issueCategories, type ServiceReport } from "@/lib/schemas";
import { MapPanel } from "./MapPanel";
import { PriorityBadge, StatusBadge } from "./Ui";

export function TriageMapClient() {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReports(loadReports()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const filtered = useMemo(() => reports.filter((report) => (category === "all" || report.fields.category === category) && (priority === "all" || report.priority === priority)), [reports, category, priority]);
  const selected = filtered.find((report) => report.id === selectedId) || filtered[0];
  return <><div className="filter-bar" style={{ gridTemplateColumns:"1fr 1fr 2fr" }}><select aria-label="Map category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{issueCategories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}</select><select aria-label="Map priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="priority">Priority</option><option value="routine">Routine</option></select><div className="public-policy"><MapPinned size={16}/> {filtered.length} markers · approximate demo coordinates</div></div><div className="dashboard-grid"><section className="panel"><MapPanel reports={filtered} selectedId={selected?.id} onSelect={setSelectedId}/>{selected && <div className="report-drawer"><p className="eyebrow">Selected report</p><div className="panel-header"><div><h2>{selected.reference}</h2><p>{categoryLabels[selected.fields.category]} · {selected.fields.location.area}</p></div><div style={{ display:"grid", gap:6 }}><PriorityBadge priority={selected.priority}/><StatusBadge status={selected.status}/></div></div><p>{selected.fields.details}</p><Link className="button button-secondary button-small" href={`/ops/reports/${selected.id}`}>Open report</Link></div>}</section><section className="panel"><div className="panel-header"><div><p className="eyebrow">Accessible alternative</p><h2>Report list</h2></div><List/></div><ul className="audit-list">{filtered.map((report) => <li key={report.id}><button style={{ all:"unset", cursor:"pointer", display:"block", width:"100%" }} onClick={() => setSelectedId(report.id)}><strong>{report.reference}</strong><p>{categoryLabels[report.fields.category]} · {report.fields.location.area}</p></button></li>)}</ul></section></div></>;
}
