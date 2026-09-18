import clsx from "clsx";
import type { ReactNode } from "react";
import { statusLabels, type Priority, type ReportStatus } from "@/lib/schemas";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="lede">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={clsx("status-badge", `status-${status}`)}>{statusLabels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={clsx("priority-badge", `priority-${priority}`)}>{priority.replace("_", " ")}</span>;
}

export function StatCard({ label, value, trend, tone = "default" }: { label: string; value: string; trend: string; tone?: "default" | "warning" | "positive" }) {
  return <article className={clsx("stat-card", `tone-${tone}`)}><p>{label}</p><strong>{value}</strong><span>{trend}</span></article>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orb">○</div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function LoadingSkeleton() {
  return <div className="skeleton-stack" aria-label="Loading"><div className="skeleton skeleton-title" /><div className="skeleton" /><div className="skeleton" /></div>;
}
