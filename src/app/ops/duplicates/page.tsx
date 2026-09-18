import { DuplicateReviewClient } from "@/components/DuplicateReviewClient";
import { PageHeader } from "@/components/Ui";

export default function DuplicateReviewPage() { return <><PageHeader eyebrow="Duplicate intelligence" title="Review before you merge." description="Compare category, distance, time, and transcript meaning. Every demo decision is visible and reversible."/><DuplicateReviewClient/></>; }
