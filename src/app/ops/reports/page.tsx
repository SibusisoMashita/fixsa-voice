import { Download } from "lucide-react";
import { ReportsListClient } from "@/components/ReportsListClient";
import { PageHeader } from "@/components/Ui";

export default function ReportsPage() { return <><PageHeader eyebrow="Incident registry" title="Reports" description="Search and triage synthetic reports without exposing resident contact details." actions={<button className="button button-ghost" title="Exports are intentionally disabled in the public demo" disabled><Download size={17}/> Export disabled</button>}/><ReportsListClient/></>; }
