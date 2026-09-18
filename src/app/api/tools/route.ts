import { NextResponse } from "next/server";
import { executeDemoTool } from "@/lib/voice-tools";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = executeDemoTool(body);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid tool call" }, { status: 400 });
  }
}
