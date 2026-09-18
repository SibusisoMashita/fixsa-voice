import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";

export default function NotFound() {
  return <section className="utility-page"><div className="error-code">404</div><MapPinned size={48} aria-hidden="true"/><h1>This route needs directions.</h1><p>We could not find that FixSA Voice page. No report or data was changed.</p><Link className="button button-primary" href="/"><ArrowLeft size={18}/> Return home</Link></section>;
}
