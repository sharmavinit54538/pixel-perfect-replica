import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import {
  Badge,
  ButtonAzure,
  ButtonGhost,
  Drawer,
  Label,
  Panel,
  statusTone,
} from "@/components/ui-kit";
import type { Call, CallStatus, Lead, Project } from "@/types";
import { getSavedCalls, setDialerOpen, subscribeCallStore } from "@/lib/call-store";
import { speakLiveText, stopLiveSpeech } from "@/lib/call-audio";
import { Phone, Grid3X3, Play, Pause, Sparkles, Volume2, Clock } from "lucide-react";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "Calls — Tutu AI Calling Assistant" },
      {
        name: "description",
        content:
          "Review every AI-handled call: customer, number, project, outcome, duration and full transcripts.",
      },
      { property: "og:title", content: "Calls — Tutu AI Calling Assistant" },
      {
        property: "og:description",
        content: "Review every AI-handled call with status badges and full transcript details.",
      },
    ],
  }),
  component: CallsPage,
});

const statusOptions: Array<"All statuses" | CallStatus> = [
  "All statuses",
  "Interested",
  "Not Interested",
  "Follow-up",
  "Completed",
];

function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [leads] = useState<Lead[]>([]);
  const [projects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All statuses");
  const [project, setProject] = useState("All projects");
  const [selected, setSelected] = useState<Call | null>(null);

  // Audio recording playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingTurnIdx, setPlayingTurnIdx] = useState(0);

  useEffect(() => {
    setCalls(getSavedCalls());
    const unsubscribe = subscribeCallStore(() => {
      setCalls(getSavedCalls());
    });
    return () => {
      unsubscribe();
      stopLiveSpeech();
    };
  }, []);

  const handlePlayRecording = () => {
    if (isPlayingAudio) {
      stopLiveSpeech();
      setIsPlayingAudio(false);
      return;
    }
    if (!selected || selected.transcript.length === 0) return;
    setIsPlayingAudio(true);
    setPlayingTurnIdx(0);

    const playTurn = (idx: number) => {
      if (idx >= selected.transcript.length) {
        setIsPlayingAudio(false);
        setPlayingTurnIdx(0);
        return;
      }
      setPlayingTurnIdx(idx);
      const turn = selected.transcript[idx]!;
      speakLiveText(turn.text, turn.speaker, {
        onEnd: () => {
          setTimeout(() => playTurn(idx + 1), 600);
        },
      });
    };

    playTurn(0);
  };

  const projectNames = useMemo(() => ["All projects", ...projects.map((p) => p.name)], [projects]);

  const filtered = useMemo(
    () =>
      calls.filter((c) => {
        const projectBase = projects.find((p) => c.project.startsWith(p.name));
        return (
          (status === "All statuses" || c.status === status) &&
          (project === "All projects" || projectBase?.name === project) &&
          (c.customer.toLowerCase().includes(query.toLowerCase()) ||
            c.number.includes(query) ||
            c.project.toLowerCase().includes(query.toLowerCase()))
        );
      }),
    [calls, query, status, project, projects],
  );

  const linkedLead = selected ? leads.find((l) => l.name === selected.customer) : undefined;
  const linkedProject = selected
    ? projects.find((p) => selected.project.startsWith(p.name))
    : undefined;

  return (
    <AppShell>
      <SectionTabs section="communication" />
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer, number or project…"
            className="min-w-[200px] flex-1 rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
          />
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
          >
            {projectNames.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof statusOptions)[number])}
            className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
          >
            {statusOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setDialerOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-azure px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-azure/90 active:scale-98 transition-all"
        >
          <Phone size={14} />
          <span>Make Call / 0-9 Keypad</span>
        </button>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 font-mono text-[10px] uppercase tracking-[0.16em] text-sub">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Date / Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-azure/5"
                >
                  <td className="px-4 py-3 font-semibold">{c.customer}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-sub">{c.number}</td>
                  <td className="px-4 py-3 text-sub">{c.project}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">{c.duration}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-sub">
                    {c.date} · {c.time}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-sub">
                    {query || status !== "All statuses" || project !== "All projects"
                      ? "No calls match these filters."
                      : "No calls recorded yet. Inbound and outbound conversations handled by Tutu AI will appear here."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer
        open={selected !== null}
        onClose={() => {
          stopLiveSpeech();
          setIsPlayingAudio(false);
          setSelected(null);
        }}
        title={selected ? `Call with ${selected.customer}` : ""}
        subtitle={selected ? `${selected.id} · ${selected.date} · ${selected.time}` : undefined}
        footer={
          <div className="flex gap-2">
            <ButtonGhost
              className="flex-1"
              onClick={() => {
                stopLiveSpeech();
                setIsPlayingAudio(false);
                setSelected(null);
              }}
            >
              Close
            </ButtonGhost>
            <ButtonAzure
              className="flex-1"
              onClick={() => {
                stopLiveSpeech();
                setIsPlayingAudio(false);
                setSelected(null);
              }}
            >
              Save outcome
            </ButtonAzure>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
              <Badge tone="neutral">Duration {selected.duration}</Badge>
              <Badge tone="azure">AI Agent · Aria</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Number</Label>
                <div className="font-mono text-[12px] font-semibold">{selected.number}</div>
              </div>
              <div>
                <Label>Duration</Label>
                <div className="text-sm font-semibold">{selected.duration}</div>
              </div>
            </div>

            <div>
              <Label>Project</Label>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-line bg-canvas/60 px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{linkedProject?.name ?? selected.project}</div>
                  {linkedProject ? (
                    <div className="font-mono text-[11px] text-sub">
                      {linkedProject.location} · {linkedProject.price}
                    </div>
                  ) : null}
                </div>
                <Link to="/projects" className="text-xs font-semibold text-azure hover:underline">
                  View project →
                </Link>
              </div>
            </div>

            <div>
              <Label>Lead</Label>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-line bg-canvas/60 px-3 py-2.5">
                {linkedLead ? (
                  <>
                    <div>
                      <div className="text-sm font-semibold">{linkedLead.name}</div>
                      <div className="font-mono text-[11px] text-sub">
                        {linkedLead.status} · Budget {linkedLead.budget}
                      </div>
                    </div>
                    <Link to="/leads" className="text-xs font-semibold text-azure hover:underline">
                      View lead →
                    </Link>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-semibold">{selected.customer}</div>
                      <div className="font-mono text-[11px] text-sub">Direct caller</div>
                    </div>
                    <Link to="/leads" className="text-xs font-semibold text-azure hover:underline">
                      View leads →
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* AI Call Summary */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={14} className="text-azure" />
                <Label>AI Call Summary & Next Action</Label>
              </div>
              <div className="rounded-xl border border-line bg-canvas/70 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Lead Qualification</span>
                  <Badge tone={selected.status === "Interested" ? "good" : selected.status === "Follow-up" ? "warn" : "neutral"}>
                    {selected.status} (92% Score)
                  </Badge>
                </div>
                <div className="text-sub text-[11px] leading-relaxed">
                  • Caller verified project amenities, pricing range, and Phase 1 possession date.
                  <br />
                  • Confirmed interest in 3 BHK unit with covered car parking.
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-900 border border-emerald-500/20 font-medium text-[11px]">
                  Next Step: Site visit coordination / WhatsApp brochure dispatched.
                </div>
              </div>
            </div>

            <div>
              <Label>Transcript ({selected.transcript.length} turns)</Label>
              <div className="mt-2 space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {selected.transcript.map((line, i) => (
                  <div key={i} className={`flex ${line.speaker === "agent" ? "" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ring-1 ${
                        line.speaker === "agent"
                          ? "rounded-tl-sm bg-azure/10 text-ink ring-azure/15"
                          : "rounded-tr-sm bg-canvas text-sub ring-line"
                      }`}
                    >
                      <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sub">
                        {line.speaker === "agent" ? "Aria · AI Voice Agent" : selected.customer}
                      </div>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Recording Player */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Audio Recording & Playback</Label>
                <span className="font-mono text-[10px] text-sub">
                  {isPlayingAudio ? `Playing turn ${playingTurnIdx + 1}/${selected.transcript.length}` : "Audio ready"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 rounded-xl border border-line bg-canvas/80 p-3 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePlayRecording}
                  className="grid size-10 place-items-center rounded-xl bg-azure text-white hover:bg-azure/90 active:scale-95 transition-all shadow-xs"
                  title={isPlayingAudio ? "Pause Audio" : "Play Recording"}
                >
                  {isPlayingAudio ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="relative h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-azure rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          selected.transcript.length > 0
                            ? ((playingTurnIdx + 1) / selected.transcript.length) * 100
                            : 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-sub">
                    <span>{isPlayingAudio ? "Listening..." : "00:00"}</span>
                    <span>{selected.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
