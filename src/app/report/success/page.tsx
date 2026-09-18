import { Suspense } from "react";
import type { Metadata } from "next";
import { SuccessClient } from "@/components/SuccessClient";

export const metadata: Metadata = { title: "Report received" };

export default function SuccessPage() { return <Suspense fallback={<div className="narrow-container"><div className="panel">Preparing your summary…</div></div>}><SuccessClient/></Suspense>; }
