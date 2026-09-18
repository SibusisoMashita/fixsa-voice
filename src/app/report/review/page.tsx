import type { Metadata } from "next";
import { ReviewClient } from "@/components/ReviewClient";
import { PageHeader } from "@/components/Ui";

export const metadata: Metadata = { title: "Review report" };

export default function ReviewPage() {
  return <div className="page-container"><ol className="progress-steps" aria-label="Report progress"><li className="done">1 <span>Speak</span></li><li className="active">2 <span>Review</span></li><li className="active">3 <span>Confirm</span></li><li>4 <span>Track</span></li></ol><PageHeader eyebrow="Clarification & review" title="You stay in control." description="Edit the extracted fields, understand any likely duplicate, and confirm the full read-back before a synthetic work order can be created or merged."/><ReviewClient/></div>;
}
