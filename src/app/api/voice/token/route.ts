import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; windowStartedAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 6;

export async function GET(request: Request) {
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = attempts.get(clientId);
  if (current && now - current.windowStartedAt < RATE_WINDOW_MS && current.count >= RATE_LIMIT) {
    return NextResponse.json({ error: "Too many voice session attempts. Wait a minute and try again." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  }
  attempts.set(clientId, !current || now - current.windowStartedAt >= RATE_WINDOW_MS ? { count: 1, windowStartedAt: now } : { ...current, count: current.count + 1 });
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Real AssemblyAI mode is not configured. Continue in deterministic demo mode." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL("https://agents.assemblyai.com/v1/token");
  url.searchParams.set("expires_in_seconds", "120");
  url.searchParams.set("max_session_duration_seconds", "900");

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "AssemblyAI token service rejected the request.", code: data.code ?? "upstream_error" }, { status: response.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ token: data.token, expiresInSeconds: data.expires_in_seconds ?? 120 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "AssemblyAI token service is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
