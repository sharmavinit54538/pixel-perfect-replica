import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, ButtonAzure, ButtonDark, ButtonGhost, Label, Panel, statusTone, Toggle } from "@/components/ui-kit";
import type { Call, Lead, Project } from "@/types";
import { getSavedCalls, subscribeCallStore } from "@/lib/call-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voice Dashboard — Tutu AI Calling Assistant" },
      { name: "description", content: "Track AI voice calls, answered rates, interested buyers and follow-ups for your real-estate projects." },
      { property: "og:title", content: "Voice Dashboard — Tutu AI Calling Assistant" },
      { property: "og:description", content: "Track AI voice calls, answered rates, interested buyers and follow-ups for your real-estate projects." },
    ],
  }),
  component: Dashboard,
});

function Kpi({ label, value, note, tone = "", delay = 0, wide = false, chip }: { label: string; value: string; note: string; tone?: string; delay?: number; wide?: boolean; chip?: string }) {
  return (
    <Panel className={`p-4 ${wide ? "col-span-2" : ""}`} delay={delay}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {chip ? <span className="rounded-md bg-azure/10 px-1.5 py-0.5 font-mono text-[10px] text-azure">{chip}</span> : null}
      </div>
      <div className={`mt-2 font-extrabold tracking-tight ${wide ? "text-3xl" : "text-2xl"} ${tone}`}>{value}</div>
      <div className="mt-1 font-mono text-[11px] text-sub">{note}</div>
    </Panel>
  );
}

function Dashboard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [leads] = useState<Lead[]>([]);
  const [projects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Call | null>(null);
  const [agentOn, setAgentOn] = useState(true);

  useEffect(() => {
    setCalls(getSavedCalls());
    const unsub = subscribeCallStore(() => {
      setCalls(getSavedCalls());
    });
    return unsub;
  }, []);

  const totalCalls = calls.length;
  const interestedCalls = calls.filter((c) => c.status === "Interested").length;
  const followUpCalls = calls.filter((c) => c.status === "Follow-up").length;
  const answeredRate = totalCalls > 0 ? "94%" : "0%";
  const interestedPercent = totalCalls > 0 ? `${Math.round((interestedCalls / totalCalls) * 100)}%` : "0%";

  return (
    <AppShell actions={<ButtonGhost className="hidden sm:block">Export</ButtonGhost>}>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi wide label="Total calls" value={String(totalCalls)} note={totalCalls > 0 ? `${totalCalls} calls logged` : "No calls logged yet"} chip={totalCalls > 0 ? "+12%" : undefined} delay={0} />
        <Kpi label="Answered" value={String(totalCalls)} note={`${answeredRate} answer rate`} delay={60} />
        <Kpi label="Interested" value={String(interestedCalls)} note={`${interestedPercent} of answers`} tone="text-good" delay={120} />
        <Kpi label="Not int." value="0" note="0% of answers" tone="text-bad" delay={180} />
        <Kpi label="Follow-ups" value={String(followUpCalls)} note={`${followUpCalls} scheduled`} tone="text-warn" delay={240} />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi wide label="Talk time" value="0 min" note="00:00 avg duration" delay={260} />
        <Kpi wide label="Call spend" value="₹0" note="₹0 per connected call" delay={280} />
        <Kpi wide label="Connected today" value="0" note="0 transferred to sales" delay={300} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" delay={300}>
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Recent calls</h2>
              <p className="font-mono text-[10px] text-sub">Live feed · tap a row for transcript</p>
            </div>
            <Link to={"/calls" as any}>
              <ButtonDark className="px-3 py-1.5 text-xs">All calls</ButtonDark>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line/70 font-mono text-[10px] uppercase tracking-[0.14em] text-sub">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 font-medium">Project</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Dur</th>
                  <th className="px-4 py-2.5 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {calls.slice(0, 5).map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer hover:bg-azure/5">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.customer}</div>
                      <div className="font-mono text-[11px] text-sub">{c.number}</div>
                    </td>
                    <td className="px-3 py-3 text-sub">{c.project}</td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{c.duration}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-sub">{c.time}</td>
                  </tr>
                ))}
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-sub">
                      No calls recorded yet. Inbound and outbound calls handled by Tutu AI will appear here in real-time.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-4 flex flex-col justify-between" delay={360}>
          {selected ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Transcript</Label>
                    <div className="text-sm font-bold tracking-tight">
                      {selected.customer} · {selected.project.split(" · ")[0]}
                    </div>
                  </div>
                  <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {selected.transcript.map((t, i) => (
                    <div
                      key={i}
                      className={
                        t.speaker === "agent"
                          ? "max-w-[92%] rounded-xl rounded-tl-sm bg-azure/10 px-3 py-2 text-ink/90"
                          : "ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-canvas px-3 py-2 text-ink/90"
                      }
                    >
                      “{t.text}”
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mt-4 flex items-center gap-2 border-t border-line/70 pt-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full w-2/3 rounded-full bg-azure" />
                  </div>
                  <span className="font-mono text-[10px] text-sub">{selected.duration}</span>
                </div>
                <Link to={"/calls" as any}>
                  <ButtonDark className="mt-3 w-full">View full record</ButtonDark>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Label>Transcript</Label>
              <p className="mt-2 max-w-[200px] text-xs text-sub">
                Select a call from the feed to review its customer conversation and audio outcome.
              </p>
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-4" delay={420}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Hot leads</h2>
            <span className="font-mono text-[10px] text-sub">{leads.length} active</span>
          </div>
          <div className="mt-3 space-y-2">
            {leads.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border border-line/70 bg-white/60 p-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-azure/15 text-xs font-bold text-azure">
                  {l.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.name}</div>
                  <div className="font-mono text-[11px] text-sub">
                    {l.project.split(" ")[0]} · {l.budget}
                  </div>
                </div>
                <Badge tone={statusTone(l.status)}>{l.status}</Badge>
              </div>
            ))}
            {leads.length === 0 ? (
              <div className="py-8 text-center text-xs text-sub">
                No hot leads captured yet. Qualified buyer leads will appear here.
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel className="p-4" delay={480}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">AI Agent</h2>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-good">
              <span className="size-1.5 animate-pulse rounded-full bg-good" />
              {agentOn ? "Live" : "Paused"}
            </span>
          </div>
          <div className="mt-3 rounded-xl border border-line/70 bg-canvas/60 p-3">
            <Label>Voice</Label>
            <div className="mt-0.5 text-sm font-semibold">Tutu AI · Warm natural, EN-IN</div>
          </div>
          <div className="mt-2.5 flex items-center justify-between rounded-xl border border-line/70 bg-canvas/60 p-3">
            <div>
              <Label>Status</Label>
              <div className="text-sm font-semibold">{agentOn ? "Active & Ready" : "Paused"}</div>
            </div>
            <Toggle on={agentOn} onChange={setAgentOn} />
          </div>
          <Link to="/agent">
            <ButtonAzure className="mt-3 w-full">Configure agent</ButtonAzure>
          </Link>
        </Panel>

        <Panel className="p-4" delay={540}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Projects</h2>
            <Link to="/projects" className="font-mono text-[11px] text-azure">
              Manage
            </Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="font-mono text-[11px] text-sub">{p.price.replace(" onwards", "+")}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-azure" style={{ width: `${p.soldPercent}%` }} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-sub">
                    {p.soldPercent}% sold · {p.unitsNote}
                  </div>
                </div>
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
              </div>
            ))}
            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-sub">
                No projects added yet.{" "}
                <Link to="/projects" className="text-azure underline font-medium">
                  Add a project
                </Link>{" "}
                to get started.
              </div>
            ) : null}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
