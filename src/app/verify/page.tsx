import { Suspense } from "react";
import type { Metadata } from "next";
import { ProofOfFixClient } from "@/components/ProofOfFixClient";
import { PageHeader } from "@/components/Ui";

export const metadata: Metadata = { title: "Proof of Fix" };

export default function VerifyPage() {
  return <div className="narrow-container"><PageHeader eyebrow="Proof of Fix" title="A closed ticket is a claim. A resident check is proof." description="Use voice to confirm a repair, report a partial fix, or reopen work that was closed too early."/><Suspense fallback={<div className="panel">Preparing the resident check…</div>}><ProofOfFixClient/></Suspense></div>;
}
