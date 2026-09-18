import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.ASSEMBLYAI_API_KEY);
  return NextResponse.json({
    ok: true,
    mode: configured && process.env.FIXSA_DEMO_MODE !== "true" ? "real" : "demo",
    assemblyai: { configured, status: configured ? "ready_for_token_check" : "not_configured" },
    retention: "ephemeral",
    syntheticData: true,
    timestamp: new Date().toISOString(),
  });
}
