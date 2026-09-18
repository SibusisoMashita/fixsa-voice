import Link from "next/link";
import { Activity, BarChart3, GitMerge, LayoutDashboard, List, Map, Settings } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  ["Overview", "/ops", LayoutDashboard],
  ["Reports", "/ops/reports", List],
  ["Duplicate review", "/ops/duplicates", GitMerge],
  ["Map & triage", "/ops/map", Map],
  ["Analytics", "/ops/analytics", BarChart3],
  ["Settings", "/ops/settings", Settings],
] as const;

export function OpsShell({ children }: { children: ReactNode }) {
  return <div className="ops-shell"><aside className="ops-sidebar"><p className="eyebrow">Demo workspace</p><h2>Operations</h2><div className="role-pill"><Activity size={15} /> Operator preview</div><nav aria-label="Operations navigation">{nav.map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={18} />{label}</Link>)}</nav><div className="sidebar-note"><strong>Safe demo</strong><p>All records are synthetic. Production mutations require an authenticated Laravel operator.</p></div></aside><section className="ops-main" aria-label="Operations workspace">{children}</section></div>;
}
