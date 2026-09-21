import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import { ButtonAzure, ButtonGhost, Label, Panel, SelectField, Toggle } from "@/components/ui-kit";
import {
  DEFAULT_CONTACTS,
  getActiveCallState,
  setDialerOpen,
  startCall,
  subscribeCallStore,
  type ActiveCallState,
} from "@/lib/call-store";
import { Activity, Grid3X3, PhoneCall, Settings2, Volume2 } from "lucide-react";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "AI Call Agent — Tutu Voice Assistant" },
      { name: "description", content: "Configure the AI calling agent: greeting script, conversation flow, language, voice and availability." },
      { property: "og:title", content: "AI Call Agent — Tutu Voice Assistant" },
      { property: "og:description", content: "Configure greeting script, conversation flow, language and voice for the AI calling agent." },
    ],
  }),
  component: AgentPage,
});

const flow = [
  { step: "01", title: "Greeting", text: "Introduces voice agent and acknowledges caller's inquiry." },
  { step: "02", title: "Qualify", text: "Identifies buyer requirements, timeline and preferences." },
  { step: "03", title: "Pitch", text: "Presents project details, amenities and pricing range." },
  { step: "04", title: "Book visit", text: "Coordinates convenient in-person or virtual site visit slot." },
  { step: "05", title: "Close", text: "Confirms details via WhatsApp/SMS and concludes call." },
];

const voices = [
  { name: "Aria", label: "Aria · Warm female, EN-IN" },
  { name: "Kabir", label: "Kabir · Calm male, EN-IN" },
  { name: "Nila", label: "Nila · Bright female, EN-IN" },
  { name: "Rohan", label: "Rohan · Deep male, EN-IN" },
];

function AgentPage() {
  const [on, setOn] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(voices[0]!.label);
  const [selectedLanguage, setSelectedLanguage] = useState("English (India)");
  const [selectedPace, setSelectedPace] = useState("Natural");
  const [greeting, setGreeting] = useState(
    "Good morning, this is Tutu Voice Assistant. You enquired about {{project}} — do you have a minute to talk about it?",
  );

  // Test call states
  const [testNumber, setTestNumber] = useState("+91 98765 43210");
  const [callState, setCallState] = useState<ActiveCallState>(getActiveCallState());
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeCallStore(() => {
      setCallState({ ...getActiveCallState() });
    });
    return unsub;
  }, []);

  // Assigned projects state (empty by default, no fake projects)
  const [assignedProjects, setAssignedProjects] = useState<string[]>([]);

  // Guardrail settings state
  const [maxCallLength, setMaxCallLength] = useState("6 minutes");
  const [retryAttempts, setRetryAttempts] = useState("2 per lead");
  const [callingWindow, setCallingWindow] = useState("09:00 – 19:30");
  const [dncRespect, setDncRespect] = useState(true);

  const voiceName = selectedVoice.split(" · ")[0] || "Aria";
  const handleTriggerTestCall = (targetNum?: string, contactName?: string) => {
    const numToCall = targetNum || testNumber;
    if (!numToCall.trim() || numToCall.trim().length < 8) {
      setTestErrorMessage("Please enter a valid phone number with country code (e.g. +91 98765 43210).");
      setTimeout(() => setTestErrorMessage(null), 4000);
      return;
    }
    setTestErrorMessage(null);
    setTestSuccessMessage(`Initiating live demonstration call with voice agent ${voiceName}...`);
    startCall(numToCall.trim(), contactName, "Godrej Horizon · Bangalore", greeting);
    setTimeout(() => setTestSuccessMessage(null), 5000);
  };

  return (
    <AppShell actions={<ButtonGhost className="hidden sm:block">Duplicate agent</ButtonGhost>}>
      <SectionTabs section="communication" />
      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="overflow-hidden border-command-line bg-command p-0 text-command-text lg:col-span-2" delay={0}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-command-line px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-azure/15 text-azure ring-1 ring-azure/25">
                <Settings2 aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Assistant configuration</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-command-muted">{voiceName} · Voice parameters</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-command-muted">
                <span className={`size-1.5 rounded-full ${on ? "bg-good" : "bg-command-muted"}`} />
                {on ? "System online" : "Paused"}
              </span>
              <Toggle on={on} onChange={setOn} />
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-command-muted">Greeting / opening message</label>
              <span className="font-mono text-[10px] text-command-muted">{greeting.length} characters</span>
            </div>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={4}
              placeholder="Enter opening greeting script..."
              className="mt-2 w-full resize-none rounded-lg border border-command-line bg-command-raised p-4 text-sm leading-relaxed text-command-text outline-none placeholder:text-command-muted focus:border-azure/60 focus:ring-2 focus:ring-azure/15"
            />
            <p className="mt-2 font-mono text-[10px] text-command-muted">
              Supported Variables: {"{{project}}"} · {"{{name}}"} · {"{{price}}"}
            </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-command-muted">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-command-line bg-command-raised px-3 py-2.5 text-sm text-command-text outline-none focus:border-azure/60"
              >
                {["English (India)", "Hindi", "Kannada", "Tamil", "Marathi"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-command-muted">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-command-line bg-command-raised px-3 py-2.5 text-sm text-command-text outline-none focus:border-azure/60"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.label}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-command-muted">Speaking pace</label>
              <select
                value={selectedPace}
                onChange={(e) => setSelectedPace(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-command-line bg-command-raised px-3 py-2.5 text-sm text-command-text outline-none focus:border-azure/60"
              >
                {["Slow", "Natural", "Brisk"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone Calling & Dialer Section */}
          <div className="mt-6 border-t border-command-line pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity aria-hidden="true" className="size-3.5 text-azure" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-command-muted">Test calling</span>
              </div>
              <button
                type="button"
                onClick={() => setDialerOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-command-line bg-command-raised px-2.5 py-1.5 text-xs font-semibold text-azure transition-colors hover:border-azure/50"
              >
                <Grid3X3 size={13} />
                <span>Open 0-9 Keypad</span>
              </button>
            </div>
            <p className="mb-3 mt-1 font-mono text-[10px] text-command-muted">
              Enter phone number, tap 0-9 keypad, or select a lead to listen to an immediate live demonstration call
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="tel"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="min-w-[220px] flex-1 rounded-lg border border-command-line bg-command-raised px-3 py-2.5 font-mono text-sm text-command-text outline-none placeholder:text-command-muted focus:border-azure/60 focus:ring-2 focus:ring-azure/15"
              />
              <ButtonAzure
                onClick={() => handleTriggerTestCall(testNumber)}
                className="flex items-center gap-2 py-2.5"
              >
                <PhoneCall size={15} />
                <span>Dial Call (Live Audio)</span>
              </ButtonAzure>
            </div>

            {/* Quick Contact Chips */}
            <div className="mt-3">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-command-muted">
                Quick Dial Lead Contacts:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CONTACTS.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setTestNumber(c.phone);
                      handleTriggerTestCall(c.phone, c.name);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-command-line bg-command-raised px-2.5 py-1.5 text-xs font-medium text-command-text transition-colors hover:border-azure/50"
                  >
                    <span className={`grid size-4 place-items-center rounded-full text-[9px] font-bold text-white ${c.avatarColor}`}>
                      {c.name[0]}
                    </span>
                    <span>{c.name}</span>
                    <span className="font-mono text-[10px] text-command-muted">({c.phone.slice(-5)})</span>
                  </button>
                ))}
              </div>
            </div>

            {testErrorMessage && (
              <p className="mt-2 text-xs text-bad">{testErrorMessage}</p>
            )}
            {testSuccessMessage && (
              <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-good">
                <span className="size-1.5 animate-pulse rounded-full bg-good" />
                {testSuccessMessage}
              </p>
            )}
          </div>
          </div>
        </Panel>

        <Panel className="p-4" delay={120}>
          <h2 className="text-sm font-bold tracking-tight">Conversation flow</h2>
          <p className="font-mono text-[10px] text-sub">Standard sequence followed during qualification</p>
          <div className="mt-4 space-y-3">
            {flow.map((f) => (
              <div key={f.step} className="flex gap-3">
                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-azure/10 font-mono text-[10px] font-medium text-azure">
                  {f.step}
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-sub">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Dynamic Greeting & Live Call Preview */}
        <Panel className="p-4" delay={180}>
          <div className="flex items-center justify-between">
            <Label>Active Greeting & Live Preview</Label>
            {callState.status === "connected" && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                <Volume2 size={11} className="animate-pulse" />
                Live Speaking
              </span>
            )}
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-xl rounded-tl-sm bg-azure/10 px-3 py-2 text-ink/90">
              “{greeting || "No opening greeting configured yet."}”
            </div>

            {callState.status === "connected" ? (
              <div className="rounded-xl border border-azure/30 bg-azure/5 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-azure">
                  <span>Ongoing Call with {callState.contactName}</span>
                  <button
                    type="button"
                    onClick={() => setDialerOpen(true)}
                    className="underline hover:text-ink font-mono text-[10px]"
                  >
                    Open Live Monitor →
                  </button>
                </div>
                <div className="text-xs italic text-ink">
                  {callState.currentSpeechText ? `“${callState.currentSpeechText}”` : "Connecting audio stream…"}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-sub">
                No live call active. Click <b>"Dial Call"</b> or <b>"Open 0-9 Keypad"</b> to hear the AI voice live.
              </div>
            )}
          </div>
        </Panel>

        {/* Assigned Projects */}
        <Panel className="p-4" delay={240}>
          <h2 className="text-sm font-bold tracking-tight">Assigned projects</h2>
          {assignedProjects.length > 0 ? (
            <div className="mt-3 space-y-2">
              {assignedProjects.map((p) => (
                <div key={p} className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/60 p-3">
                  <span className="text-sm font-semibold">{p}</span>
                  <Toggle on />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-xs text-sub">
              No projects assigned to this agent yet. You can assign projects from the Projects tab.
            </div>
          )}
        </Panel>

        {/* Guardrails */}
        <Panel className="p-4" delay={300}>
          <h2 className="text-sm font-bold tracking-tight">Guardrails</h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/60 p-3">
              <Label>Max call length</Label>
              <span className="text-sm font-semibold">{maxCallLength}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/60 p-3">
              <Label>Retry attempts</Label>
              <span className="text-sm font-semibold">{retryAttempts}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/60 p-3">
              <Label>Calling window</Label>
              <span className="text-sm font-semibold">{callingWindow}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/60 p-3">
              <Label>Do-not-call respect</Label>
              <span className="text-sm font-semibold text-good">Always on</span>
            </div>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
