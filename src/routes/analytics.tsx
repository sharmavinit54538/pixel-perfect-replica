import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { ButtonGhost, Label, Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Intelligence — Tutu Voice Assistant" },
      {
        name: "description",
        content:
          "Comprehensive metrics, real-estate lead distributions, AI voice connection trends, and campaign ROI performance analytics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function MetricCard({
  label,
  value,
  note,
  tone = "text-ink",
  chip,
  delay = 0,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
  chip?: string;
  delay?: number;
}) {
  return (
    <Panel className="p-4" delay={delay}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {chip ? (
          <span className="rounded-md bg-azure/10 px-1.5 py-0.5 font-mono text-[10px] text-azure">
            {chip}
          </span>
        ) : null}
      </div>
      <div className={`mt-2 text-2xl font-extrabold tracking-tight ${tone}`}>{value}</div>
      <div className="mt-1 font-mono text-[11px] text-sub">{note}</div>
    </Panel>
  );
}

const emptyKpis = {
  totalLeads: "0",
  totalLeadsDelta: "No data",
  callsMade: "0",
  callsMadeDelta: "No data",
  answerRate: "0%",
  answerRateDelta: "No data",
  avgDuration: "0m 00s",
  avgDurationDelta: "No data",
  interestedRate: "0%",
  interestedRateDelta: "No data",
  hotLeads: "0",
  hotLeadsDelta: "No data",
  siteVisitsBooked: "0",
  siteVisitsDelta: "No data",
  closedDeals: "0",
  closedVolume: "₹0",
};

interface CallsByDayItem {
  date: string;
  dialed: number;
  answered: number;
  interested: number;
}

interface LeadsByProjectItem {
  project: string;
  leads: number;
  visits: number;
}

interface LeadsBySourceItem {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface LeadsByBudgetItem {
  band: string;
  count: number;
  color: string;
}

interface LeadsByBhkItem {
  name: string;
  value: number;
  color: string;
}

interface LeadsByLocationItem {
  city: string;
  leads: number;
  qualified: number;
}

interface LeadsByLanguageItem {
  language: string;
  count: number;
  share: string;
}

interface CampaignPerformanceItem {
  name: string;
  project: string;
  dialed: number;
  connect: string;
  qualified: number;
  visits: number;
  cpl: string;
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState("Last 30 Days");
  const [mounted, setMounted] = useState(false);

  // Live analytics state initialized to empty arrays
  const [callsByDay] = useState<CallsByDayItem[]>([]);
  const [leadsByProject] = useState<LeadsByProjectItem[]>([]);
  const [leadsBySource] = useState<LeadsBySourceItem[]>([]);
  const [leadsByBudget] = useState<LeadsByBudgetItem[]>([]);
  const [leadsByBhk] = useState<LeadsByBhkItem[]>([]);
  const [leadsByLocation] = useState<LeadsByLocationItem[]>([]);
  const [leadsByLanguage] = useState<LeadsByLanguageItem[]>([]);
  const [campaignPerformance] = useState<CampaignPerformanceItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const kpis = emptyKpis;

  return (
    <AppShell
      title="Analytics & Intelligence"
      subtitle="Real-estate pipeline metrics, AI telephony performance, and buyer demographic distributions"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-line bg-white/80 px-3 py-1.5 text-xs font-medium outline-none"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Year to Date</option>
          </select>
          <ButtonGhost className="py-1.5 px-3 text-xs" onClick={() => alert("No data available to export.")}>
            📥 Export CSV
          </ButtonGhost>
        </div>
      }
    >
      {/* 8 Primary KPI Cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Total Leads"
          value={kpis.totalLeads}
          note={kpis.totalLeadsDelta}
          chip="Pipeline"
          delay={0}
        />
        <MetricCard
          label="Calls Dialed"
          value={kpis.callsMade}
          note={kpis.callsMadeDelta}
          chip="AI Voice"
          delay={30}
        />
        <MetricCard
          label="Answer Rate"
          value={kpis.answerRate}
          note={kpis.answerRateDelta}
          tone="text-good"
          delay={60}
        />
        <MetricCard
          label="Avg Call Duration"
          value={kpis.avgDuration}
          note={kpis.avgDurationDelta}
          delay={90}
        />
        <MetricCard
          label="Interested %"
          value={kpis.interestedRate}
          note={kpis.interestedRateDelta}
          tone="text-good"
          delay={120}
        />
        <MetricCard
          label="Hot Leads"
          value={kpis.hotLeads}
          note={kpis.hotLeadsDelta}
          chip="High Intent"
          tone="text-warn"
          delay={150}
        />
        <MetricCard
          label="Site Visits Booked"
          value={kpis.siteVisitsBooked}
          note={kpis.siteVisitsDelta}
          tone="text-azure"
          delay={180}
        />
        <MetricCard
          label="Closed Deals"
          value={kpis.closedDeals}
          note={kpis.closedVolume}
          tone="text-good"
          delay={210}
        />
      </section>

      {/* Primary Trend: Daily Calls & Conversion */}
      <Panel className="p-5" delay={240}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-ink">Calls by Day & Connection Trend</h2>
            <p className="font-mono text-xs text-sub">
              Comparison between total dialed leads, answered connections, and qualified buyer interest
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-azure" /> Dialed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-good" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-warn" /> Interested
            </span>
          </div>
        </div>

        <div className="mt-4 h-72 w-full">
          {mounted && callsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={callsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDialed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2b6bf3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2b6bf3" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e9d6a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0e9d6a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorInterested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5b6b7e" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5b6b7e" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e4e9f0",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="dialed" stroke="#2b6bf3" strokeWidth={2} fillOpacity={1} fill="url(#colorDialed)" name="Dialed" />
                <Area type="monotone" dataKey="answered" stroke="#0e9d6a" strokeWidth={2} fillOpacity={1} fill="url(#colorAnswered)" name="Answered" />
                <Area type="monotone" dataKey="interested" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorInterested)" name="Interested" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-xs text-sub gap-1.5 border border-dashed border-line rounded-xl">
              <span className="font-semibold text-ink text-sm">No Call Trend Data</span>
              <span>Daily calling and answer trends will appear here once calls are initiated.</span>
            </div>
          )}
        </div>
      </Panel>

      {/* Mid-Row: Leads by Project & Leads by Source */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leads by Project */}
        <Panel className="p-5" delay={270}>
          <div className="border-b border-line/70 pb-3">
            <h2 className="text-sm font-bold tracking-tight text-ink">Leads & Visits by Project</h2>
            <p className="font-mono text-xs text-sub">Volume breakdown of total inquiries vs. booked site visits</p>
          </div>
          <div className="mt-4 h-64 w-full">
            {mounted && leadsByProject.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f0" />
                  <XAxis dataKey="project" tick={{ fontSize: 10, fill: "#5b6b7e" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5b6b7e" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e4e9f0",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="leads" name="Total Leads" fill="#2b6bf3" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visits" name="Site Visits" fill="#0e9d6a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-xs text-sub gap-1.5 border border-dashed border-line rounded-xl">
                <span className="font-semibold text-ink text-sm">No Project Inquiries Yet</span>
                <span>Project lead and visit breakdown will show once leads are connected to projects.</span>
              </div>
            )}
          </div>
        </Panel>

        {/* Leads by Source */}
        <Panel className="p-5" delay={300}>
          <div className="border-b border-line/70 pb-3">
            <h2 className="text-sm font-bold tracking-tight text-ink">Leads by Inbound & Outbound Source</h2>
            <p className="font-mono text-xs text-sub">Customer acquisition channel distribution</p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {mounted && leadsBySource.length > 0 ? (
              <>
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsBySource}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {leadsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e4e9f0",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 text-xs w-full">
                  {leadsBySource.map((s) => (
                    <div key={s.name} className="flex items-center justify-between py-1 border-b border-line/50 last:border-0">
                      <span className="flex items-center gap-2 text-sub">
                        <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate max-w-[140px]">{s.name}</span>
                      </span>
                      <span className="font-mono font-bold text-ink">
                        {s.value} <span className="font-normal text-sub">({s.percent}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-sub w-full border border-dashed border-line rounded-xl">
                No customer acquisition source data available yet.
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Breakdown Row: Budget, BHK, Location, Language */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Leads by Budget */}
        <Panel className="p-4" delay={330}>
          <Label>Leads by Budget Band</Label>
          <div className="mt-3 space-y-2.5">
            {leadsByBudget.length > 0 ? (
              leadsByBudget.map((b) => (
                <div key={b.band}>
                  <div className="flex justify-between text-xs font-semibold text-ink">
                    <span>{b.band}</span>
                    <span className="font-mono">{b.count} leads</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(b.count / 100) * 100}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-sub border border-dashed border-line rounded-lg">
                No budget data recorded yet.
              </div>
            )}
          </div>
        </Panel>

        {/* Leads by BHK */}
        <Panel className="p-4" delay={360}>
          <Label>Leads by Unit Configuration</Label>
          <div className="mt-3 space-y-2.5">
            {leadsByBhk.length > 0 ? (
              leadsByBhk.map((u) => (
                <div key={u.name}>
                  <div className="flex justify-between text-xs font-semibold text-ink">
                    <span>{u.name}</span>
                    <span className="font-mono">{u.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(u.value / 100) * 100}%`,
                        backgroundColor: u.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-sub border border-dashed border-line rounded-lg">
                No unit preference data recorded yet.
              </div>
            )}
          </div>
        </Panel>

        {/* Leads by Location */}
        <Panel className="p-4" delay={390}>
          <Label>Leads by Buyer Location</Label>
          <div className="mt-3 space-y-2">
            {leadsByLocation.length > 0 ? (
              leadsByLocation.map((loc) => (
                <div key={loc.city} className="flex items-center justify-between rounded-lg bg-canvas/60 p-2 text-xs">
                  <div>
                    <div className="font-bold text-ink">{loc.city}</div>
                    <div className="font-mono text-[10px] text-good">{loc.qualified} qualified</div>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-ink">{loc.leads}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-sub border border-dashed border-line rounded-lg">
                No buyer locations recorded yet.
              </div>
            )}
          </div>
        </Panel>

        {/* Leads by Language */}
        <Panel className="p-4" delay={420}>
          <Label>Leads by Language Preference</Label>
          <div className="mt-3 space-y-2">
            {leadsByLanguage.length > 0 ? (
              leadsByLanguage.map((lang) => (
                <div key={lang.language} className="flex items-center justify-between border-b border-line/60 pb-1.5 text-xs last:border-0">
                  <span className="font-medium text-ink">{lang.language}</span>
                  <div className="text-right font-mono">
                    <span className="font-bold text-ink">{lang.count}</span>
                    <span className="text-[10px] text-sub ml-1">({lang.share})</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-sub border border-dashed border-line rounded-lg">
                No language preferences recorded yet.
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Campaign Performance Table */}
      <Panel className="overflow-hidden" delay={450}>
        <div className="border-b border-line/70 px-5 py-4">
          <h2 className="text-sm font-bold tracking-tight text-ink">Campaign ROI & Performance Comparison</h2>
          <p className="font-mono text-xs text-sub">Efficiency metrics per voice campaign sequence</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 font-mono text-[10px] uppercase tracking-[0.16em] text-sub">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Dialed</th>
                <th className="px-4 py-3 font-medium">Answer Rate</th>
                <th className="px-4 py-3 font-medium">Qualified Leads</th>
                <th className="px-4 py-3 font-medium">Site Visits</th>
                <th className="px-5 py-3 text-right font-medium">Cost / Qualified Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {campaignPerformance.length > 0 ? (
                campaignPerformance.map((c) => (
                  <tr key={c.name} className="hover:bg-azure/5 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-ink">{c.name}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-sub">{c.project}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-ink">{c.dialed}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-good font-bold">{c.connect}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">{c.qualified}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-azure">{c.visits}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-ink">{c.cpl}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-sub">
                    No campaign performance data available yet. Launch campaigns to measure calling ROI and conversion.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
