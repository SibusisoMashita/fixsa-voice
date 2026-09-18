import Link from "next/link";
import { AlertTriangle, ArrowLeft, Keyboard, MicOff, RotateCw, Unplug, WifiOff } from "lucide-react";
import { notFound } from "next/navigation";

const states = {
  offline: { icon: WifiOff, title: "You appear to be offline.", text: "Your unfinished typed draft stays in this browser session, but map tiles, real voice mode, and server checks need a connection.", action: "Try again" },
  "api-unavailable": { icon: Unplug, title: "Voice service is unavailable.", text: "AssemblyAI real mode could not connect. No report was created. Continue with the deterministic demo or keyboard path.", action: "Use demo mode" },
  "microphone-denied": { icon: MicOff, title: "Microphone access is blocked.", text: "Use your browser’s site settings to allow the microphone, reload the page, or complete the same workflow with the keyboard.", action: "Open keyboard report" },
  "unsupported-browser": { icon: AlertTriangle, title: "This browser cannot run live voice.", text: "Secure microphone capture, AudioWorklet, and WebSocket support are required. The keyboard alternative remains fully available.", action: "Use keyboard report" },
} as const;

export default async function StatusPage({ params }: { params: Promise<{ state:string }> }) {
  const { state } = await params;
  const item = states[state as keyof typeof states];
  if (!item) notFound();
  const Icon = item.icon;
  const href = state === "offline" ? "/status/offline" : state === "api-unavailable" ? "/report?mode=demo" : "/report";
  return <section className="utility-page"><div className="error-code">RECOVERY PATH</div><Icon size={52}/><h1>{item.title}</h1><p>{item.text}</p><div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}><Link className="button button-primary" href={href}>{state === "offline" ? <RotateCw size={17}/> : <Keyboard size={17}/>} {item.action}</Link><Link className="button button-ghost" href="/help"><ArrowLeft size={17}/> Help centre</Link></div></section>;
}
