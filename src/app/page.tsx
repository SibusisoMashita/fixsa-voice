import Link from "next/link";
import { ArrowRight, AudioLines, Bolt, CheckCircle2, Clock3, Construction, Droplets, Eye, FileSearch, GitMerge, Landmark, Lightbulb, MapPin, MessageSquareText, Mic2, Recycle, ShieldCheck, Siren, Users, Waves } from "lucide-react";

const bars = [20, 44, 70, 32, 78, 50, 90, 58, 36, 67, 29, 54, 86, 42, 22];

export default function HomePage() {
  return <>
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow" style={{ color: "var(--lime)" }}>Voice-first civic reporting</p>
          <h1>Speak. <span>Track. Fix.</span></h1>
          <p className="lede">Describe a service-delivery problem in your own words. FixSA Voice turns it into a complete, deduplicated, trackable work order—without making you navigate a maze of forms.</p>
          <div className="hero-actions"><Link href="/report" className="button button-primary"><Mic2 size={19}/> Report an issue</Link><Link href="/track" className="button button-ghost"><FileSearch size={19}/> Track a report</Link></div>
          <div className="trust-line"><span><ShieldCheck size={16}/> Consent before transcription</span><span><Clock3 size={16}/> Audio ephemeral by default</span><span><Eye size={16}/> Explicit confirmation required</span></div>
        </div>
        <div className="hero-console" aria-label="Preview of the voice reporting experience">
          <div className="console-top"><span>Live report · demo</span><span className="live-dot">Listening</span></div>
          <div className="console-body">
            <div className="waveform" aria-hidden="true">{bars.map((height, index) => <i key={index} style={{ "--h": height, "--i": index } as React.CSSProperties}/>)}</div>
            <div className="transcript-bubble">“There is a large water leak near the clinic on Tamboti Road. It started yesterday and the road is flooding.”</div>
            <div className="extraction-row"><span className="chip"><Droplets size={14}/> Water leak</span><span className="chip"><MapPin size={14}/> Tamboti Rd</span><span className="chip"><Siren size={14}/> High severity</span></div>
          </div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="section-inner"><p className="eyebrow">One conversation, not twelve fields</p><div className="page-header"><div><h2>From spoken report to a useful work order.</h2><p className="lede">FixSA Voice listens, checks what is missing, detects duplicates, then waits for your confirmation.</p></div></div>
        <div className="three-grid">
          <article className="feature-card"><span className="step-number">01 · SPEAK</span><Mic2 size={36}/><h3>Tell the whole story</h3><p>Speak naturally or type instead. The live transcript stays visible and editable.</p></article>
          <article className="feature-card"><span className="step-number">02 · CHECK</span><GitMerge size={36}/><h3>Fill gaps and find matches</h3><p>The agent asks only for required missing detail and explains likely duplicate reports.</p></article>
          <article className="feature-card"><span className="step-number">03 · TRACK</span><CheckCircle2 size={36}/><h3>Confirm before creation</h3><p>Review the read-back, approve the draft, and use the demo reference to track progress.</p></article>
        </div>
      </div>
    </section>

    <section className="section dark-section">
      <div className="section-inner"><p className="eyebrow">Supported categories</p><h2>Everyday issues, structured for action.</h2><p className="lede">The demo routes seven common service-delivery categories using a consistent data contract.</p>
        <div className="category-grid">
          {[[Droplets,"Water leaks"],[Construction,"Potholes"],[Bolt,"Electricity faults"],[Waves,"Sewer overflows"],[Lightbulb,"Broken streetlights"],[Recycle,"Illegal dumping"],[Landmark,"Damaged public assets"]].map(([Icon,label]) => { const C = Icon as typeof Droplets; return <div className="category-card" key={String(label)}><C size={27}/><strong>{String(label)}</strong></div>; })}
          <div className="category-card"><AudioLines size={27}/><strong>More via configurable routing</strong></div>
        </div>
      </div>
    </section>

    <section className="section"><div className="section-inner two-grid">
      <div><p className="eyebrow">For residents</p><h2>Less friction. More clarity.</h2><p className="lede">Accessible voice and keyboard paths, plain-language prompts, a visible transcript, and a reference you can return to.</p><div className="callout"><MessageSquareText/><div><strong>Your words remain yours</strong><p>Review and edit every extracted field before anything is created. Audio is not retained in demo mode.</p></div></div></div>
      <div><p className="eyebrow">For operations teams</p><h2>Cleaner intake. Faster triage.</h2><p className="lede">Structured categories, SLA rules, duplicate evidence, severity signals, and an audit trail reduce manual cleanup.</p><div className="callout"><Users/><div><strong>Built for authorised integration</strong><p>The demo shows the workflow; a municipality or utility would still need to approve routing, identity, retention, and dispatch.</p></div></div></div>
    </div></section>

    <section className="section" style={{ background: "var(--white)" }}><div className="section-inner"><div className="panel" style={{ background: "var(--forest)", color: "white", padding: "clamp(28px,5vw,60px)" }}><p className="eyebrow" style={{ color: "var(--lime)" }}>Judge-ready demo</p><div className="page-header" style={{ marginBottom: 0 }}><div><h2>See the whole voice-agent journey.</h2><p className="lede" style={{ color: "#b5c9c1" }}>Run a water leak, dangerous electricity fault, pothole, or duplicate scenario—no API key required.</p></div><Link href="/demo" className="button button-primary">Open scenarios <ArrowRight size={18}/></Link></div></div></div></section>

    <section className="section"><div className="section-inner three-grid">
      <div><ShieldCheck size={28}/><h3>Privacy by design</h3><p>Consent first, minimal synthetic data, server-only secrets, redacted public views, and visible retention state.</p><Link href="/privacy">Read the privacy notice →</Link></div>
      <div><Siren size={28}/><h3>Safety before automation</h3><p>Immediate-danger language stops ordinary ticket creation and directs the resident to official local emergency help.</p><Link href="/help">Read safety guidance →</Link></div>
      <div><Eye size={28}/><h3>Accessible by default</h3><p>Keyboard alternatives, semantic controls, live transcript text, strong focus states, and reduced-motion support.</p><Link href="/accessibility">Accessibility statement →</Link></div>
    </div></section>
  </>;
}
