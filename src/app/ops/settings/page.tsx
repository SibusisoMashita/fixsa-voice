import { SettingsClient } from "@/components/SettingsClient";
import { PageHeader } from "@/components/Ui";

export default function SettingsPage() { return <><PageHeader eyebrow="Configuration & trust" title="Settings and integrations" description="See the real/demo boundary, retention posture, field visibility, routing, and inactive integration placeholders."/><SettingsClient/></>; }
