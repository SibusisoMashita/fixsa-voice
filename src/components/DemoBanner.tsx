import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      <FlaskConical size={16} aria-hidden="true" />
      <strong>Hackathon demo</strong>
      <span>Synthetic data · No report is sent to a real municipality</span>
    </div>
  );
}
