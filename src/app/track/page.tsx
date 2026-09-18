import { Suspense } from "react";
import type { Metadata } from "next";
import { TrackClient } from "@/components/TrackClient";
import { PageHeader } from "@/components/Ui";

export const metadata: Metadata = { title: "Track a report" };

export default function TrackPage() { return <div className="narrow-container"><PageHeader eyebrow="Public tracking" title="See what happens next." description="Look up a synthetic reference, follow its timeline, and add non-sensitive evidence. Private operator fields stay hidden."/><Suspense fallback={<div className="panel">Preparing tracking…</div>}><TrackClient/></Suspense></div>; }
