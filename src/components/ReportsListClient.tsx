"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadReports } from "@/lib/demo-store";
import { categoryLabels, issueCategories, reportStatuses, type ServiceReport } from "@/lib/schemas";
import { EmptyState, PriorityBadge, StatusBadge } from "./Ui";

export function ReportsListClient() {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [area, setArea] = useState("all");
  const [sort, setSort] = useState("newest");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReports(loadReports()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const filtered = useMemo(() => reports.filter((report) => {
    const haystack = `${report.reference} ${report.fields.details} ${report.fields.location.area}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (category === "all" || report.fields.category === category) && (status === "all" || report.status === status) && (priority === "all" || report.priority === priority) && (area === "all" || report.fields.location.area === area);
  }).sort((a,b) => sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : sort === "priority" ? ["emergency_hold","urgent","priority","routine"].indexOf(a.priority) - ["emergency_hold","urgent","priority","routine"].indexOf(b.priority) : b.createdAt.localeCompare(a.createdAt)), [reports, query, category, status, priority, area, sort]);
  const areas = [...new Set(reports.map((report) => report.fields.location.area))];
  return <><div className="filter-bar"><label className="field"><span className="sr-only">Search reports</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, detail, area…"/></label><select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{issueCategories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}</select><select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{reportStatuses.map((item) => <option key={item} value={item}>{item.replace("_"," ")}</option>)}</select><select aria-label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="priority">Priority</option><option value="routine">Routine</option></select><select aria-label="Area" value={area} onChange={(event) => setArea(event.target.value)}><option value="all">All areas</option>{areas.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Priority first</option></select></div>
    {filtered.length ? <section className="panel"><div className="panel-header"><div><p className="eyebrow">{filtered.length} synthetic records</p><h2>Report queue</h2></div><SlidersHorizontal/></div><div className="table-wrap desktop-table"><table><thead><tr><th>Reference</th><th>Created</th><th>Issue</th><th>Area</th><th>Priority</th><th>Status</th><th>Assignee</th></tr></thead><tbody>{filtered.map((report) => <tr key={report.id}><td><Link href={`/ops/reports/${report.id}`}>{report.reference}</Link></td><td>{new Date(report.createdAt).toLocaleDateString("en-ZA", { day:"2-digit", month:"short" })}</td><td>{categoryLabels[report.fields.category]}</td><td>{report.fields.location.area}</td><td><PriorityBadge priority={report.priority}/></td><td><StatusBadge status={report.status}/></td><td>{report.assignee || "Unassigned"}</td></tr>)}</tbody></table></div><div className="mobile-report-cards">{filtered.map((report) => <article className="mobile-report-card" key={report.id}><header><Link href={`/ops/reports/${report.id}`}>{report.reference}</Link><PriorityBadge priority={report.priority}/></header><p><strong>{categoryLabels[report.fields.category]}</strong><br/>{report.fields.location.area}</p><footer><StatusBadge status={report.status}/><span>{report.assignee || "Unassigned"}</span></footer></article>)}</div><div className="pagination"><span>Showing 1–{filtered.length} of {filtered.length}</span><div><button className="active">1</button><button disabled>2</button><button disabled>›</button></div></div></section> : <EmptyState title="No reports match" description="Adjust the filters or clear the search. The synthetic dataset remains unchanged." action={<button className="button button-ghost" onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); setPriority("all"); setArea("all"); }}><Search size={17}/> Clear filters</button>}/>}</>;
}
