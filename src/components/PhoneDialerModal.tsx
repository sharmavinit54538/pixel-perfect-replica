import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Delete,
  Volume2,
  VolumeX,
  Users,
  Grid3X3,
  CheckCircle2,
  Sparkles,
  Calendar,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Clock,
  ChevronRight,
  Search,
  Sliders,
} from "lucide-react";
import {
  DEFAULT_CONTACTS,
  getActiveCallState,
  isDialerOpen,
  playKeypadTone,
  resetDialer,
  setDialerOpen,
  startCall,
  endCall,
  subscribeCallStore,
  toggleListenLive,
  updateCallVolume,
  type Contact,
  type ActiveCallState,
} from "@/lib/call-store";
import { speakLiveText, stopLiveSpeech } from "@/lib/call-audio";

const KEYPAD_BUTTONS = [
  { digit: "1", sub: "·" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "·" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "·" },
];

export function PhoneDialerModal() {
  const [open, setOpen] = useState(false);
  const [callState, setCallState] = useState<ActiveCallState>(getActiveCallState());
  const [activeTab, setActiveTab] = useState<"keypad" | "contacts">("keypad");
  const [dialedNumber, setDialedNumber] = useState("+91 ");
  const [contactSearch, setContactSearch] = useState("");
  const [customProject, setCustomProject] = useState("Godrej Horizon · Bangalore");

  // Recording replay states
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncState = () => {
      setOpen(isDialerOpen());
      setCallState({ ...getActiveCallState() });
    };
    syncState();
    return subscribeCallStore(syncState);
  }, []);

  // Auto-scroll transcript on update
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [callState.transcript, callState.currentSpeechText]);

  // Handle keypad click
  const handleKeypadPress = (digit: string) => {
    playKeypadTone(digit);
    setDialedNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => {
      if (prev.length <= 4 && prev.startsWith("+91 ")) return "+91 ";
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setDialedNumber("+91 ");
  };

  const handleStartCallWithNumber = () => {
    const rawNumber = dialedNumber.trim();
    if (rawNumber.length < 8) return;
    startCall(rawNumber, undefined, customProject);
  };

  const handleStartCallWithContact = (contact: Contact) => {
    setDialedNumber(contact.phone);
    startCall(contact.phone, contact.name, contact.project);
  };

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return DEFAULT_CONTACTS;
    const q = contactSearch.toLowerCase();
    return DEFAULT_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.project.toLowerCase().includes(q)
    );
  }, [contactSearch]);

  // Handle Replay Recording
  const handleToggleReplay = () => {
    if (isReplaying) {
      stopLiveSpeech();
      setIsReplaying(false);
      return;
    }

    if (callState.transcript.length === 0) return;
    setIsReplaying(true);
    setReplayIndex(0);

    const playNext = (index: number) => {
      if (index >= callState.transcript.length) {
        setIsReplaying(false);
        setReplayIndex(0);
        return;
      }
      setReplayIndex(index);
      const item = callState.transcript[index]!;
      speakLiveText(item.text, item.speaker, {
        volume: callState.volume,
        onEnd: () => {
          setTimeout(() => playNext(index + 1), 600);
        },
      });
    };

    playNext(0);
  };

  if (!open) return null;

  const isCallActive =
    callState.status === "dialing" ||
    callState.status === "ringing" ||
    callState.status === "connected";

  const isCallEnded = callState.status === "ended";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isCallActive) {
            setDialerOpen(false);
          }
        }}
        className="absolute inset-0 bg-ink/50 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line/90 bg-white/95 shadow-2xl backdrop-blur-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-line/80 px-5 py-3.5 bg-canvas/60">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-azure text-white shadow-xs">
              <PhoneCall size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-ink">
                {isCallActive ? "Live Call Monitor" : isCallEnded ? "Call Summary & Recording" : "Phone Dialer"}
              </h2>
              <p className="font-mono text-[10px] text-sub">
                {isCallActive
                  ? "AI Agent Aria · Live Audio"
                  : isCallEnded
                  ? "Call Completed · Recording Saved"
                  : "0-9 Keypad & Contact Selector"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDialerOpen(false)}
            className="grid size-7 place-items-center rounded-full text-sub hover:bg-black/5 hover:text-ink transition-colors"
            title="Close dialer"
          >
            ✕
          </button>
        </div>

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ========================================================= */}
          {/* 1. KEYPAD & CONTACTS VIEW (When Idle)                     */}
          {/* ========================================================= */}
          {callState.status === "idle" && (
            <div>
              {/* Tab Navigation */}
              <div className="mb-4 flex rounded-xl border border-line/80 bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("keypad")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "keypad"
                      ? "bg-white text-azure shadow-xs"
                      : "text-sub hover:text-ink"
                  }`}
                >
                  <Grid3X3 size={15} />
                  <span>0-9 Keypad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contacts")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "contacts"
                      ? "bg-white text-azure shadow-xs"
                      : "text-sub hover:text-ink"
                  }`}
                >
                  <Users size={15} />
                  <span>Contacts ({DEFAULT_CONTACTS.length})</span>
                </button>
              </div>

              {activeTab === "keypad" ? (
                <div>
                  {/* Phone Number Display */}
                  <div className="relative mb-4 flex items-center justify-between rounded-2xl border border-line/80 bg-canvas/80 px-4 py-3 shadow-inner">
                    <div className="flex-1 overflow-x-auto pr-2">
                      <div className="font-mono text-xl font-bold tracking-wider text-ink">
                        {dialedNumber || "+91 "}
                      </div>
                      <div className="font-mono text-[10px] text-sub truncate">
                        Project: {customProject}
                      </div>
                    </div>

                    {dialedNumber.length > 4 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleBackspace}
                          className="grid size-8 place-items-center rounded-lg text-sub hover:bg-black/5 hover:text-ink transition-colors"
                          title="Backspace"
                        >
                          <Delete size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={handleClear}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-sub hover:bg-black/5"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Contact Chips */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-sub">
                        Quick Dial
                      </span>
                      <button
                        onClick={() => setActiveTab("contacts")}
                        className="text-[11px] font-medium text-azure hover:underline"
                      >
                        All contacts →
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {DEFAULT_CONTACTS.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleStartCallWithContact(c)}
                          className="flex shrink-0 items-center gap-2 rounded-xl border border-line/70 bg-white/70 px-2.5 py-1.5 text-left hover:border-azure/40 hover:bg-azure/5 transition-all"
                        >
                          <span className={`grid size-6 place-items-center rounded-full text-[10px] font-bold text-white ${c.avatarColor}`}>
                            {c.name[0]}
                          </span>
                          <div className="leading-tight">
                            <div className="text-xs font-semibold">{c.name.split(" ")[0]}</div>
                            <div className="font-mono text-[9px] text-sub">{c.phone.slice(-5)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 0-9 Keypad Grid */}
                  <div className="grid grid-cols-3 gap-2.5 px-2">
                    {KEYPAD_BUTTONS.map(({ digit, sub }) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white/80 py-3 shadow-xs active:scale-95 active:bg-azure/10 hover:border-azure/30 hover:bg-canvas transition-all"
                      >
                        <span className="text-xl font-bold text-ink">{digit}</span>
                        <span className="font-mono text-[9px] font-medium tracking-widest text-sub">
                          {sub}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Call Action Button */}
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={handleStartCallWithNumber}
                      disabled={dialedNumber.trim().length < 8}
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <div className="grid size-8 place-items-center rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                        <Phone size={18} fill="currentColor" />
                      </div>
                      <span className="text-base tracking-wide">Call Number</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CONTACTS LIST */
                <div className="space-y-3">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sub"
                    />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search leads by name or number…"
                      className="w-full rounded-xl border border-line bg-canvas/70 py-2 pl-9 pr-3 text-xs outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                    />
                  </div>

                  <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-xl border border-line/70 bg-white/70 p-3 hover:border-azure/30 hover:bg-azure/5 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <div
                            className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${contact.avatarColor}`}
                          >
                            {contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-bold text-ink">
                                {contact.name}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                  contact.status === "Hot"
                                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                }`}
                              >
                                {contact.status}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-sub truncate">
                              {contact.phone}
                            </div>
                            <div className="text-[10px] text-sub truncate">
                              {contact.project} · {contact.budget}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartCallWithContact(contact)}
                          className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                          title={`Call ${contact.name}`}
                        >
                          <Phone size={15} fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. ACTIVE LIVE CALL VIEW (Dialing / Ringing / Connected)   */}
          {/* ========================================================= */}
          {isCallActive && (
            <div className="space-y-4">
              {/* Caller Avatar & Status Header */}
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <div className="relative">
                  <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-tr from-azure to-blue-600 text-xl font-bold text-white shadow-md">
                    {callState.contactName
                      .split(" ")
                      .map((n) => n[0])
                      .join("") || "C"}
                  </div>
                  {callState.status === "connected" && (
                    <span className="absolute -bottom-1 -right-1 flex size-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-4 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </span>
                  )}
                </div>

                <h3 className="mt-2 text-base font-bold text-ink">
                  {callState.contactName}
                </h3>
                <p className="font-mono text-xs text-sub">{callState.phoneNumber}</p>
                <p className="text-[11px] font-medium text-azure mt-0.5">
                  {callState.projectName}
                </p>

                {/* Status Badge & Timer */}
                <div className="mt-3 flex items-center gap-2">
                  {callState.status === "dialing" && (
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-mono text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      <span className="size-2 animate-ping rounded-full bg-amber-500" />
                      Dialing via Voice Gateway…
                    </span>
                  )}
                  {callState.status === "ringing" && (
                    <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                      <Volume2 size={13} className="animate-bounce" />
                      Ringing customer handset…
                    </span>
                  )}
                  {callState.status === "connected" && (
                    <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 font-mono text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 shadow-xs">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                      LIVE CALL ·{" "}
                      {Math.floor(callState.durationSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {(callState.durationSeconds % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>

              {/* LIVE AUDIO LISTENING MONITOR (User can listen live!) */}
              <div className="rounded-2xl border border-azure/20 bg-gradient-to-r from-azure/5 via-blue-50/40 to-azure/10 p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid size-7 place-items-center rounded-lg bg-azure text-white">
                      <Volume2 size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">
                        Live Audio Monitoring
                      </div>
                      <div className="text-[10px] text-sub">
                        {callState.listenLive
                          ? "Listening enabled (Audio plays through speaker)"
                          : "Audio muted"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleListenLive}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      callState.listenLive
                        ? "bg-azure text-white shadow-xs"
                        : "border border-line bg-white text-sub"
                    }`}
                  >
                    {callState.listenLive ? (
                      <>
                        <Volume2 size={13} />
                        <span>Live On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX size={13} />
                        <span>Unmute</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Animated Waveform Visualizer */}
                {callState.status === "connected" && (
                  <div className="mt-3 flex items-center justify-center gap-1 h-7">
                    {[16, 24, 12, 32, 28, 14, 26, 30, 20, 36, 18, 28, 14, 22].map(
                      (h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            callState.currentSpeaker === "agent"
                              ? "bg-azure animate-pulse"
                              : callState.currentSpeaker === "customer"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-line"
                          }`}
                          style={{
                            height:
                              callState.currentSpeaker !== "none"
                                ? `${Math.max(6, (h * (i % 3 + 1)) % 28)}px`
                                : "5px",
                            animationDelay: `${i * 70}ms`,
                          }}
                        />
                      )
                    )}
                  </div>
                )}

                {/* Current Speaker Tag */}
                {callState.status === "connected" && (
                  <div className="mt-2 text-center font-mono text-[10px] text-sub">
                    {callState.currentSpeaker === "agent" ? (
                      <span className="font-semibold text-azure">
                        🗣 Aria (AI Voice Assistant) speaking…
                      </span>
                    ) : callState.currentSpeaker === "customer" ? (
                      <span className="font-semibold text-emerald-600">
                        👤 {callState.contactName} responding…
                      </span>
                    ) : (
                      <span>Waiting for response…</span>
                    )}
                  </div>
                )}
              </div>

              {/* LIVE TRANSCRIPT FEED */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-sub">
                    Live Transcript
                  </span>
                  <span className="font-mono text-[10px] text-sub">
                    {callState.transcript.length} turns
                  </span>
                </div>

                <div
                  ref={transcriptScrollRef}
                  className="max-h-[200px] min-h-[120px] space-y-2.5 overflow-y-auto rounded-2xl border border-line/80 bg-canvas/70 p-3 text-xs leading-relaxed"
                >
                  {callState.transcript.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        item.speaker === "agent" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                          item.speaker === "agent"
                            ? "rounded-tl-xs bg-white text-ink shadow-xs ring-1 ring-black/5"
                            : "rounded-tr-xs bg-azure text-white shadow-xs"
                        }`}
                      >
                        <div
                          className={`mb-0.5 font-mono text-[9px] uppercase tracking-wider ${
                            item.speaker === "agent" ? "text-azure" : "text-white/80"
                          }`}
                        >
                          {item.speaker === "agent" ? "Aria · AI" : callState.contactName}
                        </div>
                        <div>{item.text}</div>
                      </div>
                    </div>
                  ))}

                  {callState.transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-sub">
                      <MessageSquare size={20} className="mb-1 opacity-50" />
                      <p className="text-xs">Waiting for caller connection…</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Control Footer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => endCall(true)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-98 transition-all"
                >
                  <PhoneOff size={18} />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. POST-CALL SUMMARY & RECORDING PLAYER                   */}
          {/* ========================================================= */}
          {isCallEnded && (
            <div className="space-y-4">
              {/* Outcome Header */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      Call Completed Successfully
                    </h4>
                    <p className="font-mono text-[10px] text-emerald-700">
                      Duration:{" "}
                      {Math.floor(callState.durationSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {(callState.durationSeconds % 60)
                        .toString()
                        .padStart(2, "0")}{" "}
                      · Logged to CRM
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
                  Interested
                </span>
              </div>

              {/* AI CALL SUMMARY CARD */}
              {callState.summary && (
                <div className="rounded-2xl border border-line/80 bg-canvas/70 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                      <Sparkles size={14} className="text-azure" />
                      <span>AI Call Summary</span>
                    </div>
                    <span className="rounded-full bg-azure/10 px-2 py-0.5 font-mono text-[10px] font-bold text-azure">
                      Score: {callState.summary.qualificationScore}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-white/80 p-2.5 border border-line/60">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-sub">
                        Preference
                      </div>
                      <div className="font-semibold text-ink mt-0.5">
                        {callState.summary.preferredConfig}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5 border border-line/60">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-sub">
                        Budget
                      </div>
                      <div className="font-semibold text-ink mt-0.5">
                        {callState.summary.budgetRange}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/80 p-2.5 border border-line/60">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-sub mb-1">
                      Key Discussion Points
                    </div>
                    <ul className="space-y-1 text-xs text-sub">
                      {callState.summary.keyDiscussion.map((point, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-azure font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 font-bold mb-0.5">
                      Next Action Item
                    </div>
                    <div className="text-xs font-semibold text-emerald-900">
                      {callState.summary.nextAction}
                    </div>
                  </div>
                </div>
              )}

              {/* CALL RECORDING PLAYER */}
              <div className="rounded-2xl border border-line/80 bg-white/80 p-3.5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-sub" />
                    <span className="text-xs font-bold text-ink">
                      Call Audio Recording
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-sub">
                    {isReplaying
                      ? `Replaying turn ${replayIndex + 1}/${callState.transcript.length}`
                      : "Ready to replay"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleReplay}
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-azure text-white shadow-xs hover:bg-azure/90 active:scale-95 transition-all"
                    title={isReplaying ? "Pause replay" : "Play recording"}
                  >
                    {isReplaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex-1">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full bg-azure transition-all duration-300 rounded-full"
                        style={{
                          width: `${
                            callState.transcript.length > 0
                              ? ((replayIndex + 1) / callState.transcript.length) * 100
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono text-[9px] text-sub">
                      <span>00:00</span>
                      <span>
                        {Math.floor(callState.durationSeconds / 60)
                          .toString()
                          .padStart(2, "0")}
                        :
                        {(callState.durationSeconds % 60)
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetDialer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white py-2.5 text-xs font-bold text-ink shadow-xs hover:bg-canvas transition-all"
                >
                  <RotateCcw size={14} />
                  <span>Make Another Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDialerOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-azure py-2.5 text-xs font-bold text-white shadow-xs hover:bg-azure/90 transition-all"
                >
                  <span>Done & Close</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
