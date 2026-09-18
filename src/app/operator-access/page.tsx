import { ArrowRight, Database, EyeOff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/Ui";

function safeNextPath(value: string | undefined) {
  if (!value?.startsWith("/ops") || value.startsWith("//")) return "/ops";
  return value;
}

export default async function OperatorAccessPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="narrow-container">
      <PageHeader
        eyebrow="Safe demo access"
        title="Enter the operator workspace"
        description="This role gate separates the public resident journey from the synthetic operations demo. It is intentionally open for hackathon judges and is not production authentication."
      />
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Demo operator role</p>
            <h2>No private credentials required</h2>
          </div>
          <ShieldCheck aria-hidden="true" />
        </div>
        <div className="three-grid" style={{ marginBottom: 28 }}>
          <div>
            <Database aria-hidden="true" />
            <h3>Synthetic records</h3>
            <p>Every person, address, team, reference and metric is fabricated for this demonstration.</p>
          </div>
          <div>
            <EyeOff aria-hidden="true" />
            <h3>Local changes</h3>
            <p>Status and assignment changes stay in this browser and never dispatch a real service crew.</p>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" />
            <h3>Explicit boundary</h3>
            <p>A production operator role would require verified identity, server-side authorisation and an audited data store.</p>
          </div>
        </div>
        <form action="/api/demo-role" method="post">
          <input type="hidden" name="next" value={safeNextPath(next)} />
          <button className="button button-primary button-wide" type="submit">
            Enter demo operator workspace <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  );
}
