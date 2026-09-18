import { TriageMapClient } from "@/components/TriageMapClient";
import { PageHeader } from "@/components/Ui";

export default function MapTriagePage() { return <><PageHeader eyebrow="Spatial triage" title="See clusters. Keep the list." description="Explore synthetic incidents on OpenStreetMap tiles or use the equivalent keyboard-friendly list."/><TriageMapClient/></>; }
