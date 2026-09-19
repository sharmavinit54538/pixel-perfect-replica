import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import {
  Badge,
  ButtonAzure,
  ButtonGhost,
  Drawer,
  Field,
  Label,
  Modal,
  Panel,
  SelectField,
  statusTone,
} from "@/components/ui-kit";
import type { Lead, Project } from "@/types";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Tutu AI Calling Assistant" },
      {
        name: "description",
        content:
          "Manage buyer leads captured by the AI calling agent: interest level, budget, status, follow-ups and notes.",
      },
      { property: "og:title", content: "Leads — Tutu AI Calling Assistant" },
      {
        property: "og:description",
        content: "Manage buyer leads captured by the AI calling agent, with follow-up scheduling.",
      },
    ],
  }),
  component: LeadsPage,
});

const statusOptions = ["All statuses", "Hot", "Warm", "Cold", "Closed"];
const interestOptions = ["All interest", "High", "Medium", "Low"];

function interestTone(interest: Lead["interest"]) {
  return interest === "High" ? "good" : interest === "Medium" ? "warn" : "neutral";
}

function LeadsPage() {
  const [leads] = useState<Lead[]>([]);
  const [projects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(statusOptions[0]);
  const [interest, setInterest] = useState(interestOptions[0]);
  const [project, setProject] = useState("All projects");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [scheduling, setScheduling] = useState<Lead | null>(null);

  const projectNames = useMemo(() => ["All projects", ...projects.map((p) => p.name)], [projects]);

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          (status === "All statuses" || l.status === status) &&
          (interest === "All interest" || l.interest === interest) &&
          (project === "All projects" || l.project === project) &&
          (l.name.toLowerCase().includes(query.toLowerCase()) ||
            l.phone.includes(query) ||
            l.project.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, status, interest, project],
  );

  return (
    <AppShell>
      <SectionTabs section="crm" />
      <Panel className="flex flex-wrap items-center gap-2 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone or project…"
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
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
        >
          {statusOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
        >
          {interestOptions.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 font-mono text-[10px] uppercase tracking-[0.16em] text-sub">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Follow-up</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-azure/5"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{l.name}</div>
                    <div className="font-mono text-[11px] text-sub">{l.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sub">{l.project}</td>
                  <td className="px-4 py-3 font-semibold">{l.budget}</td>
                  <td className="px-4 py-3">
                    <Badge tone={interestTone(l.interest)}>{l.interest}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-sub">{l.followUp}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduling(l);
                      }}
                      className="rounded-lg border border-line bg-white/70 px-2.5 py-1.5 text-xs font-medium text-sub hover:bg-white"
                    >
                      Schedule
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-sub">
                    {query || status !== statusOptions[0] || interest !== interestOptions[0] || project !== "All projects"
                      ? "No leads match these filters."
                      : "No buyer leads captured yet. Qualified leads from Tutu voice agent calls will appear here."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.phone}
        footer={
          <div className="flex gap-2">
            <ButtonGhost className="flex-1" onClick={() => setSelected(null)}>
              Close
            </ButtonGhost>
            <Link to="/whatsapp" search={{ phone: selected?.phone ?? "" } as any} className="flex-1">
              <ButtonAzure className="w-full">Send WhatsApp</ButtonAzure>
            </Link>
            <ButtonAzure
              className="flex-1"
              onClick={() => {
                setScheduling(selected);
                setSelected(null);
              }}
            >
              Schedule follow-up
            </ButtonAzure>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex gap-2">
              <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
              <Badge tone={interestTone(selected.interest)}>{selected.interest} interest</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Budget</Label>
                <div className="text-sm font-semibold">{selected.budget}</div>
              </div>
              <div>
                <Label>Follow-up</Label>
                <div className="text-sm font-semibold">{selected.followUp}</div>
              </div>
            </div>
            <div>
              <Label>Project</Label>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-line bg-canvas/60 px-3 py-2.5">
                <div className="text-sm font-semibold">{selected.project}</div>
                <Link to="/projects" className="text-xs font-semibold text-azure hover:underline">
                  View project →
                </Link>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <p className="mt-1 rounded-lg border border-line bg-canvas/60 px-3 py-2.5 text-sm leading-relaxed text-sub">
                {selected.notes}
              </p>
            </div>
            <div>
              <Label>Activity</Label>
              <ul className="mt-2 space-y-2.5 border-l border-line pl-4">
                <li className="text-sm">
                  <span className="font-medium">AI call completed</span>
                  <span className="block font-mono text-[11px] text-sub">Marked {selected.status.toLowerCase()} by Aria</span>
                </li>
                <li className="text-sm">
                  <span className="font-medium">Lead captured from call</span>
                  <span className="block font-mono text-[11px] text-sub">Source: AI Calling Agent</span>
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={scheduling !== null}
        onClose={() => setScheduling(null)}
        title={scheduling ? `Schedule follow-up — ${scheduling.name}` : "Schedule follow-up"}
        footer={
          <>
            <ButtonGhost onClick={() => setScheduling(null)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={() => setScheduling(null)}>Schedule</ButtonAzure>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" type="date" />
          <Field label="Time" type="time" />
          <SelectField label="Channel" options={["AI call", "WhatsApp", "Site visit", "Email"]} />
          <SelectField label="Assigned to" options={["Aria (AI Agent)", "Anika Rao", "Sales team"]} />
          <div className="sm:col-span-2">
            <Field label="Note" placeholder="Discuss payment plan and corner unit availability…" />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
