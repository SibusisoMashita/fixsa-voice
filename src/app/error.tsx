"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("FixSA route error", error);
  }, [error]);
  return <section className="utility-page" role="alert"><div className="error-code">APPLICATION ERROR</div><AlertTriangle size={52}/><h1>This view could not load.</h1><p>No report was created or changed. Retry the route, or use the help centre if the problem continues.</p><button className="button button-primary" onClick={reset}><RotateCw size={17}/> Try again</button></section>;
}
