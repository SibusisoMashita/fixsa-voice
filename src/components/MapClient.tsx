"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { ServiceReport } from "@/lib/schemas";
import { categoryLabels } from "@/lib/schemas";

function markerIcon(report: ServiceReport) {
  const color = report.priority === "urgent" || report.priority === "emergency_hold" ? "#a7352c" : report.priority === "priority" ? "#a96e00" : "#0c201b";
  return L.divIcon({ className: "fixsa-marker", html: `<span style="--marker-color:${color}">${report.fields.category === "water_leak" ? "W" : report.fields.category === "pothole" ? "P" : "•"}</span>`, iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -34] });
}

export function MapClient({ reports, selectedId, onSelect }: { reports: ServiceReport[]; selectedId?: string; onSelect?: (id: string) => void }) {
  const center: [number, number] = reports.length ? [reports[0].fields.location.latitude, reports[0].fields.location.longitude] : [-26.04, 28.08];
  return <MapContainer center={center} zoom={11} scrollWheelZoom aria-label="Interactive map of synthetic service reports"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{reports.map((report) => <Marker key={report.id} position={[report.fields.location.latitude, report.fields.location.longitude]} icon={markerIcon(report)} eventHandlers={{ click: () => onSelect?.(report.id) }} opacity={selectedId && selectedId !== report.id ? .55 : 1}><Popup><strong>{report.reference}</strong><br/>{categoryLabels[report.fields.category]}<br/>{report.fields.location.area}</Popup></Marker>)}</MapContainer>;
}
