"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ImagePlus, Keyboard, LocateFixed, Mic, RefreshCw, Send, ShieldCheck, StopCircle, Volume2, VolumeX } from "lucide-react";
import { assignPriority, calculateSlaDue, detectImmediateDanger, extractDemoFields, findDuplicates, slaHoursFor } from "@/lib/domain";
import { loadReports, saveDraft, upsertReport } from "@/lib/demo-store";
import { seedReports } from "@/lib/seed";
import { extractedFieldsSchema, type ReportDraft, type ServiceReport, type TranscriptSegment } from "@/lib/schemas";
import { executeDemoTool, FIXSA_AGENT_PROMPT, voiceToolDefinitions } from "@/lib/voice-tools";
import { FIXSA_GREETING, FIXSA_VOICE_INPUT, FIXSA_VOICE_OUTPUT } from "@/lib/voice-agent-config";

type VoiceState = "idle" | "requesting" | "connecting" | "listening" | "processing" | "stopped" | "denied" | "error";
type Mode = "demo" | "real";
type VoiceMessage = { type: string; text?: string; delta?: string; data?: string; call_id?: string; name?: string; arguments?: Record<string, unknown>; status?: string; message?: string };

const demoScenarios: Record<string, string> = {
  water: "There is a large water leak near the clinic on Tamboti Road. It started yesterday and the road is flooding.",
  pothole: "There is a deep pothole on Republic Road near the taxi rank. Cars are swerving and it has been there for about a week.",
  duplicate: "The big water leak on Tamboti Road near the clinic is still flooding the road since yesterday.",
  electricity: "There is an exposed electrical cable sparking beside the school gate and children are walking nearby.",
};

const scenarioLocations: Record<string, string> = {
  water: "Tamboti Road, near Ivory Park Clinic",
  pothole: "Republic Road, near the taxi rank",
  duplicate: "Tamboti Road, near Ivory Park Clinic",
  electricity: "School gate, synthetic demo area",
};

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return window.btoa(binary);
}

function applyLocalToolMutation(name: string, args: Record<string, unknown>, result: Record<string, unknown>) {
  if (result.error) return;
  const now = new Date().toISOString();
  if (name === "create_service_request" && typeof result.reference === "string") {
    const fields = extractedFieldsSchema.parse(args.fields);
    const priority = assignPriority(fields);
    const report: ServiceReport = {
      id: crypto.randomUUID(), reference: result.reference, createdAt: now, updatedAt: now, source: "voice", status: "reported", priority, fields,
      transcript: [{ id: crypto.randomUUID(), speaker: "resident", text: fields.details, timestamp: now, final: true }],
      evidence: [{ id: crypto.randomUUID(), type: "transcript", name: "Confirmed AssemblyAI voice transcript", addedAt: now, public: false }],
      statusEvents: [{ id: crypto.randomUUID(), status: "reported", at: now, note: "Synthetic voice work order created after explicit confirmation.", public: true, actor: "agent" }],
      publicNotes: ["Report received by the FixSA Voice demo."], internalNotes: ["Created through the real Voice Agent adapter using synthetic demo persistence."], assignee: null,
      slaHours: slaHoursFor(priority), slaDueAt: calculateSlaDue(now, priority), duplicateOf: null, mergedReportIds: [], audioRetention: "ephemeral_deleted", safetyHold: false, synthetic: true,
    };
    upsertReport(report);
  }
  if (name === "merge_with_existing_report" && typeof args.reference === "string") {
    const existing = loadReports().find((report) => report.reference === args.reference);
    if (existing) upsertReport({ ...existing, updatedAt: now, evidence: [...existing.evidence, { id: crypto.randomUUID(), type: "transcript", name: "Corroborating AssemblyAI voice evidence", addedAt: now, public: false }], mergedReportIds: [...existing.mergedReportIds, `voice-${Date.now()}`], statusEvents: [...existing.statusEvents, { id: crypto.randomUUID(), status: existing.status, at: now, note: "Explicitly confirmed demo merge through the real Voice Agent adapter.", public: true, actor: "agent" }] });
  }
  if (name === "attach_evidence" && typeof args.reference === "string" && typeof result.note === "string") {
    const existing = loadReports().find((report) => report.reference === args.reference);
    if (existing) upsertReport({ ...existing, updatedAt: now, evidence: [...existing.evidence, { id: crypto.randomUUID(), type: "note", name: result.note, addedAt: now, public: false }] });
  }
  if (name === "update_report_status" && typeof args.reference === "string" && typeof result.status === "string") {
    const existing = loadReports().find((report) => report.reference === args.reference);
    if (existing) upsertReport({ ...existing, updatedAt: now, status: result.status as ServiceReport["status"], statusEvents: [...existing.statusEvents, { id: crypto.randomUUID(), status: result.status as ServiceReport["status"], at: now, note: String(result.note || "Demo status updated."), public: true, actor: "operator" }] });
  }
}

export function VoiceReportClient() {
  const router = useRouter();
  const search = useSearchParams();
  const requestedScenario = search.get("scenario") || "water";
  const requestedMode = search.get("mode") === "real" ? "real" : "demo";
  const [mode, setMode] = useState<Mode>(requestedMode);
  const [consent, setConsent] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [messages, setMessages] = useState<TranscriptSegment[]>([]);
  const [manualText, setManualText] = useState(demoScenarios[requestedScenario] || demoScenarios.water);
  const [showManual, setShowManual] = useState(false);
  const [muted, setMuted] = useState(false);
  const [danger, setDanger] = useState(false);
  const [error, setError] = useState("");
  const [locationText, setLocationText] = useState(scenarioLocations[requestedScenario] || scenarioLocations.water);
  const [locationStatus, setLocationStatus] = useState("Optional · not shared");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackTimeRef = useRef(0);
  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const pendingToolsRef = useRef<Array<{ callId: string; result: unknown }>>([]);
  const lastEventRef = useRef<string>("");
  const latestResidentUtteranceRef = useRef("");
  const newResidentUtteranceRef = useRef(true);
  const confirmationGrantedRef = useRef(false);
  const agentTurnBufferRef = useRef("");
  const previousAgentTurnRef = useRef("");

  const stopPlayback = useCallback(() => {
    for (const source of playbackSourcesRef.current) {
      try { source.stop(); } catch { /* source already ended */ }
    }
    playbackSourcesRef.current.clear();
    playbackTimeRef.current = audioContextRef.current?.currentTime || 0;
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (demoRef.current) clearInterval(demoRef.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: "session.end" }));
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    stopPlayback();
    audioContextRef.current?.close().catch(() => undefined);
    wsRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    pendingToolsRef.current = [];
  }, [stopPlayback]);

  useEffect(() => () => cleanup(), [cleanup]);
  useEffect(() => {
    const endOnPageHide = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: "session.end" }));
    };
    window.addEventListener("pagehide", endOnPageHide);
    return () => window.removeEventListener("pagehide", endOnPageHide);
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
  };

  const flushTools = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || lastEventRef.current !== "reply.done") return;
    for (const pending of pendingToolsRef.current) ws.send(JSON.stringify({ type: "tool.result", call_id: pending.callId, result: JSON.stringify(pending.result) }));
    pendingToolsRef.current = [];
  }, []);

  const playAudio = useCallback((base64: string) => {
    if (muted || !audioContextRef.current) return;
    const raw = window.atob(base64);
    const pcm = new Int16Array(raw.length / 2);
    for (let index = 0; index < pcm.length; index += 1) pcm[index] = raw.charCodeAt(index * 2) | (raw.charCodeAt(index * 2 + 1) << 8);
    const floats = new Float32Array(pcm.length);
    for (let index = 0; index < pcm.length; index += 1) floats[index] = pcm[index] / 32768;
    const buffer = audioContextRef.current.createBuffer(1, floats.length, 24000);
    buffer.getChannelData(0).set(floats);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    playbackTimeRef.current = Math.max(playbackTimeRef.current, audioContextRef.current.currentTime + 0.02);
    source.start(playbackTimeRef.current);
    playbackTimeRef.current += buffer.duration;
    playbackSourcesRef.current.add(source);
    source.onended = () => playbackSourcesRef.current.delete(source);
  }, [muted]);

  const handleMessage = useCallback(async (event: MessageEvent<string>) => {
    const message = JSON.parse(event.data) as VoiceMessage;
    lastEventRef.current = message.type;
    if (message.type === "session.ready") setVoiceState("listening");
    if (message.type === "transcript.user.delta") setPartial(message.text || "");
    if (message.type === "transcript.user") {
      const text = message.text || "";
      if (newResidentUtteranceRef.current) {
        previousAgentTurnRef.current = agentTurnBufferRef.current;
        agentTurnBufferRef.current = "";
      }
      latestResidentUtteranceRef.current = newResidentUtteranceRef.current
        ? text
        : `${latestResidentUtteranceRef.current} ${text}`.trim().slice(-1_000);
      newResidentUtteranceRef.current = false;
      if (/\b(?:no|not correct|wrong|change|correction)\b/i.test(text)) confirmationGrantedRef.current = false;
      setTranscript((current) => `${current} ${text}`.trim());
      setPartial("");
      setMessages((current) => [...current, { id: crypto.randomUUID(), speaker: "resident", text, timestamp: new Date().toISOString(), final: true }]);
      if (detectImmediateDanger(text).requiresEmergencyGuidance) setDanger(true);
    }
    if (message.type === "transcript.agent") {
      agentTurnBufferRef.current = `${agentTurnBufferRef.current} ${message.text || ""}`.trim().slice(-2_000);
      setMessages((current) => [...current, { id: crypto.randomUUID(), speaker: "agent", text: message.text || "", timestamp: new Date().toISOString(), final: true }]);
    }
    if (message.type === "reply.audio" && message.data) playAudio(message.data);
    if (message.type === "reply.done") {
      if (message.status === "interrupted") {
        pendingToolsRef.current = [];
        stopPlayback();
      }
      else flushTools();
      newResidentUtteranceRef.current = true;
    }
    if (message.type === "reply.started" || message.type === "input.speech.started") lastEventRef.current = message.type;
    if (message.type === "tool.call" && message.name && message.call_id) {
      let result: Record<string, unknown>;
      try {
        if (message.name === "classify_service_issue") confirmationGrantedRef.current = false;
        result = executeDemoTool(
          { name: message.name, arguments: message.arguments || {} },
          loadReports(),
          {
            actor: "resident",
            latestResidentUtterance: latestResidentUtteranceRef.current,
            confirmationGranted: confirmationGrantedRef.current,
            readbackRequested: /is that (?:right|correct)|does that sound right/i.test(previousAgentTurnRef.current),
          },
        ) as Record<string, unknown>;
        if (message.name === "confirm_report_details") confirmationGrantedRef.current = result.confirmed === true && !result.error;
        if (["create_service_request", "merge_with_existing_report"].includes(message.name) && !result.error) confirmationGrantedRef.current = false;
        applyLocalToolMutation(message.name, message.arguments || {}, result);
      } catch (caught) {
        result = { error: caught instanceof Error ? caught.message : "The tool arguments were invalid." };
      }
      pendingToolsRef.current.push({ callId: message.call_id, result });
      flushTools();
    }
    if (message.type === "session.error" || message.type === "error") {
      setError(message.message || "The voice session encountered an error.");
      setVoiceState("error");
    }
    if (message.type === "session.ended") {
      cleanup();
      setVoiceState("stopped");
    }
  }, [cleanup, flushTools, playAudio, stopPlayback]);

  const startReal = async () => {
    setVoiceState("requesting");
    latestResidentUtteranceRef.current = "";
    newResidentUtteranceRef.current = true;
    confirmationGrantedRef.current = false;
    agentTurnBufferRef.current = "";
    previousAgentTurnRef.current = "";
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.WebSocket) {
        setVoiceState("error");
        setError("This browser does not support the secure audio features required for real voice mode. Use the keyboard path or demo mode.");
        return;
      }
      const tokenResponse = await fetch("/api/voice/token", { cache: "no-store" });
      if (!tokenResponse.ok) throw new Error((await tokenResponse.json()).error || "Real mode is unavailable.");
      const { token } = await tokenResponse.json();
      const audioContext = new AudioContext();
      await audioContext.resume();
      await audioContext.audioWorklet.addModule("/pcm-processor.js");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
      audioContextRef.current = audioContext;
      streamRef.current = stream;
      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "fixsa-pcm-processor", { processorOptions: { inputSampleRate: audioContext.sampleRate, targetSampleRate: 24000 } });
      source.connect(worklet);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      worklet.connect(silentGain).connect(audioContext.destination);
      const wsUrl = new URL("wss://agents.assemblyai.com/v1/ws");
      wsUrl.searchParams.set("token", token);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setVoiceState("connecting");
      worklet.port.onmessage = (message) => {
        if (ws.readyState === WebSocket.OPEN && voiceState !== "stopped") ws.send(JSON.stringify({ type: "input.audio", audio: toBase64(message.data) }));
      };
      ws.addEventListener("open", () => {
        const agentId = process.env.NEXT_PUBLIC_ASSEMBLYAI_AGENT_ID;
        const session = agentId ? { agent_id: agentId } : { system_prompt: FIXSA_AGENT_PROMPT, greeting: FIXSA_GREETING, tools: voiceToolDefinitions, input: FIXSA_VOICE_INPUT, output: FIXSA_VOICE_OUTPUT };
        ws.send(JSON.stringify({ type: "session.update", session }));
      });
      ws.addEventListener("message", handleMessage);
      ws.addEventListener("close", () => setVoiceState((state) => state === "stopped" ? state : "error"));
      startTimer();
    } catch (caught) {
      cleanup();
      if (caught instanceof DOMException && caught.name === "NotAllowedError") {
        setVoiceState("denied");
        setError("Microphone permission was denied. You can still complete the report with the keyboard.");
      } else {
        setVoiceState("error");
        setError(caught instanceof Error ? caught.message : "Could not start the voice session.");
      }
    }
  };

  const startDemo = () => {
    setVoiceState("listening");
    setError("");
    setDanger(false);
    setTranscript("");
    setPartial("");
    const text = demoScenarios[requestedScenario] || demoScenarios.water;
    const words = text.split(" ");
    let index = 0;
    startTimer();
    demoRef.current = setInterval(() => {
      index += 1;
      setPartial(words.slice(0, index).join(" "));
      if (index >= words.length) {
        if (demoRef.current) clearInterval(demoRef.current);
        setTranscript(text);
        setPartial("");
        setMessages([
          { id: "demo-resident", speaker: "resident", text, timestamp: new Date().toISOString(), final: true },
          { id: "demo-agent", speaker: "agent", text: detectImmediateDanger(text).requiresEmergencyGuidance ? "Please move away from the danger and contact the official local emergency service. I will not create an ordinary ticket for this immediate-danger report." : "I’ve structured that report. Let’s review the details and any nearby matches before you confirm.", timestamp: new Date().toISOString(), final: true },
        ]);
        setDanger(detectImmediateDanger(text).requiresEmergencyGuidance);
        setVoiceState("processing");
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 85);
  };

  const start = () => {
    if (!consent) return;
    if (mode === "real") void startReal(); else startDemo();
  };

  const stop = () => {
    cleanup();
    setVoiceState("stopped");
  };

  const useLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("Geolocation unsupported · type a landmark instead"); return; }
    setLocationStatus("Requesting permission…");
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus("Approximate location added · review before confirming"),
      () => setLocationStatus("Location not shared · type a landmark instead"),
      { enableHighAccuracy: false, timeout: 7000 },
    );
  };

  const continueToReview = (sourceText = transcript || manualText) => {
    if (sourceText.trim().length < 10) { setError("Please describe the issue in at least a short sentence."); return; }
    const fields = extractDemoFields(sourceText);
    if (locationText.trim()) fields.location.address = locationText.trim();
    const safety = detectImmediateDanger(sourceText).requiresEmergencyGuidance;
    if (safety) { setDanger(true); return; }
    const draft: ReportDraft = { id: crypto.randomUUID(), source: showManual ? "text" : requestedScenario ? "demo_scenario" : "voice", rawTranscript: sourceText, fields, duplicates: findDuplicates(fields, seedReports), confirmed: false, safetyHold: false };
    saveDraft(draft);
    router.push("/report/review");
  };

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  const active = ["requesting", "connecting", "listening"].includes(voiceState);

  return <>
    <ol className="progress-steps" aria-label="Report progress"><li className="active">1 <span>Speak</span></li><li>2 <span>Review</span></li><li>3 <span>Confirm</span></li><li>4 <span>Track</span></li></ol>
    <div className="voice-layout">
      <section className="panel voice-studio" aria-labelledby="voice-heading">
        <div className="connection-row"><span className={`connection-status ${voiceState}`}>{mode === "demo" ? "Deterministic demo" : voiceState.replace("_", " ")}</span><span>English · South African accents</span></div>
        <h2 id="voice-heading">Tell us what happened.</h2>
        <p className="voice-state-label">Speak naturally. Include where it is, how long it has been happening, and any danger.</p>
        <button className={`mic-control ${voiceState === "listening" ? "listening" : ""}`} onClick={active ? stop : start} disabled={!consent || voiceState === "processing"} aria-label={active ? "Stop listening" : "Start listening"}>
          {active ? <StopCircle size={48}/> : <Mic size={48}/>}<span className="sr-only">{active ? "Stop" : "Start"}</span>
        </button>
        <p className="timer" aria-live="polite">{minutes}:{seconds}</p>
        <p className="voice-state-label">{voiceState === "idle" ? "Ready when you are" : voiceState === "listening" ? "Listening… tap to stop" : voiceState === "processing" ? "Transcript ready" : voiceState === "denied" ? "Microphone blocked" : voiceState}</p>
        <div className="voice-transcript" aria-live="polite" aria-label="Live transcript">
          <p className="eyebrow">Live transcript</p>
          {transcript || partial ? <p>{transcript} <span className="partial">{partial}</span></p> : <p className="partial">Your words will appear here. Audio is ephemeral by default.</p>}
          {messages.filter((item) => item.speaker === "agent").slice(-1).map((item) => <p key={item.id}><strong>FixSA:</strong> {item.text}</p>)}
        </div>
        <div className="voice-controls"><button className="button button-ghost button-small" onClick={() => { if (!muted) stopPlayback(); setMuted((value) => !value); }}>{muted ? <VolumeX size={16}/> : <Volume2 size={16}/>} {muted ? "Unmute agent" : "Mute agent"}</button><button className="button button-ghost button-small" onClick={() => { cleanup(); setTranscript(""); setPartial(""); setMessages([]); setVoiceState("idle"); setError(""); }}><RefreshCw size={16}/> Retry</button><button className="button button-ghost button-small" onClick={() => setShowManual(true)}><Keyboard size={16}/> Use keyboard</button></div>
      </section>

      <aside className="settings-list">
        <section className="panel consent-box"><p className="eyebrow">Before you begin</p><div className="mode-switch" aria-label="Connection mode"><button onClick={() => setMode("demo")} aria-pressed={mode === "demo"}>Demo mode</button><button onClick={() => setMode("real")} aria-pressed={mode === "real"}>Real API</button></div><div className="callout" style={{ marginTop: 16 }}><ShieldCheck size={22}/><div><strong>Privacy at the microphone</strong><p>Live audio is used only to transcribe and respond. FixSA does not store recordings in demo mode.</p></div></div><label className="check-row" style={{ marginTop: 18 }}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}/><span><strong>I consent to live transcription</strong><br/><small>I understand this is a synthetic hackathon demo.</small></span></label></section>
        <section className="panel"><div className="panel-header"><div><p className="eyebrow">Optional location</p><h2>Help place the issue</h2></div><MapPinIcon /></div><div className="field"><label htmlFor="location">Street, area, or landmark</label><input id="location" value={locationText} onChange={(event) => setLocationText(event.target.value)} placeholder="e.g. Tamboti Road near the clinic"/><small>{locationStatus}</small></div><button className="button button-ghost button-small" style={{ marginTop: 12 }} onClick={useLocation}><LocateFixed size={16}/> Use my approximate location</button></section>
        <section className="panel"><p className="eyebrow">Optional evidence</p><label className="button button-ghost button-wide"><ImagePlus size={17}/> Add a demo photo<input type="file" accept="image/*" hidden onChange={(event) => event.target.files?.[0] && setLocationStatus(`${event.target.files[0].name} selected · kept in this browser only`)}/></label></section>
      </aside>
    </div>

    {showManual && <section className="panel" style={{ marginTop: 24 }}><div className="panel-header"><div><p className="eyebrow">Keyboard alternative</p><h2>Type the report</h2></div><Keyboard/></div><div className="field"><label htmlFor="manual-report">What happened?</label><textarea id="manual-report" value={manualText} onChange={(event) => setManualText(event.target.value)} /></div><button className="button button-secondary" style={{ marginTop: 14 }} onClick={() => continueToReview(manualText)}><Send size={17}/> Analyse typed report</button></section>}

    {error && <div className="callout warning" style={{ marginTop: 24 }} role="alert"><AlertTriangle/><div><strong>Voice path unavailable</strong><p>{error}</p><button className="button button-ghost button-small" onClick={() => setShowManual(true)}><Keyboard size={16}/> Continue with keyboard</button></div></div>}
    {danger && <div className="callout danger" style={{ marginTop: 24 }} role="alert"><AlertTriangle/><div><strong>Immediate danger detected — ordinary automation stopped</strong><p>Move away from the hazard and contact the appropriate official local emergency service now. FixSA Voice is not an emergency service and does not display an unverified number. This draft can be flagged for an authorised operator, but it will not be submitted as a normal work order.</p></div></div>}
    {!danger && (transcript || voiceState === "processing") && <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}><button className="button button-primary" onClick={() => continueToReview()}><Send size={18}/> Review extracted details</button></div>}
  </>;
}

function MapPinIcon() { return <LocateFixed aria-hidden="true"/>; }
