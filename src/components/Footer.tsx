import Link from "next/link";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div><Brand /><p>A voice-first civic issue reporting concept by VALO Systems.</p></div>
        <div><h2>Product</h2><Link href="/report">Report an issue</Link><Link href="/track">Track a report</Link><Link href="/demo">Demo scenarios</Link><Link href="/about">About</Link></div>
        <div><h2>Trust</h2><Link href="/privacy">Privacy</Link><Link href="/terms">Terms & demo disclaimer</Link><Link href="/accessibility">Accessibility</Link><Link href="/help">Help & FAQ</Link></div>
        <div><h2>Operator demo</h2><Link href="/ops">Dashboard</Link><Link href="/ops/reports">Reports</Link><Link href="/ops/settings">Settings</Link><p>No private contact details are displayed.</p></div>
      </div>
      <div className="footer-bottom"><span>© 2026 VALO Systems</span><span>Built for the AssemblyAI Voice Agent Hackathon</span></div>
    </footer>
  );
}
