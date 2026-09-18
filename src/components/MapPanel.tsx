"use client";

import dynamic from "next/dynamic";
import type { ServiceReport } from "@/lib/schemas";

const DynamicMap = dynamic(() => import("./MapClient").then((module) => module.MapClient), { ssr: false, loading: () => <div className="empty-state"><p>Loading accessible map…</p></div> });

export function MapPanel(props: { reports: ServiceReport[]; selectedId?: string; onSelect?: (id: string) => void }) {
  return <div className="map-frame"><DynamicMap {...props}/><div className="map-legend" aria-label="Map legend"><strong>Priority</strong><span><i className="legend-dot urgent"/> Urgent</span><span><i className="legend-dot"/> Priority / routine</span></div></div>;
}
