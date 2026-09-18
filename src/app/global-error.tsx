"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en-ZA"><body><main className="utility-page"><div className="error-code">FIXSA VOICE</div><h1>The application needs a restart.</h1><p>No report was submitted. Reload the experience or continue with the keyboard path after recovery.</p><button className="button button-primary" onClick={reset}>Reload application</button></main></body></html>;
}
