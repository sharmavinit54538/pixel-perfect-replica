import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import {
  Badge,
  ButtonAzure,
  ButtonDark,
  ButtonGhost,
  Drawer,
  Label,
  Modal,
  Panel,
} from "@/components/ui-kit";
import {
  CalendarDays,
  LayoutList,
  Search,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building2,
  Users,
  Check,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Sparkles,
  MapPin,
} from "lucide-react";
import type { SiteVisit, SiteVisitStatus } from "@/types";

export const Route = createFileRoute("/site-visits")({
  head: () => ({
    meta: [
      { title: "Site Visits — Tutu AI Calling Assistant" },
      {
        name: "description",
        content:
          "Schedule, calendar-coordinate, confirm, and complete in-person property site visits booked by the voice agent and sales managers.",
      },
    ],
  }),
  component: SiteVisitsPage,
});

const statusOptions: ("All statuses" | SiteVisitStatus)[] = [
  "All statuses",
  "Confirmed",
  "Scheduled",
  "Completed",
  "Rescheduled",
  "Cancelled",
];

function visitStatusTone(status: SiteVisitStatus) {
  switch (status) {
    case "Confirmed":
    case "Completed":
      return "good";
    case "Scheduled":
      return "azure";
    case "Rescheduled":
      return "warn";
    case "Cancelled":
      return "bad";
    default:
      return "neutral";
  }
}

function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const STORAGE_KEY = "tutu_site_visits_v2";

function SiteVisitsPage() {
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const todayDate = useMemo(() => new Date(), []);

  const [visits, setVisits] = useState<SiteVisit[]>(() => {
    if (typeof window !== "undefined") {
      try {
        // Permanently clear legacy mock visits from storage
        localStorage.removeItem("tutu_site_visits_v1");
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((v: SiteVisit) => !/^sv-[0-9]{1,2}$/.test(v.id));
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("tutu_site_visits_v1");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
      } catch {
        // ignore
      }
    }
  }, [visits]);

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All projects");
  const [statusFilter, setStatusFilter] = useState<"All statuses" | SiteVisitStatus>("All statuses");

  // Dynamic calendar year and month
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selection and Modals
  const [selected, setSelected] = useState<SiteVisit | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [reschedulingVisit, setReschedulingVisit] = useState<SiteVisit | null>(null);
  const [cancellingVisit, setCancellingVisit] = useState<SiteVisit | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState(todayStr);
  const [rescheduleTime, setRescheduleTime] = useState("11:00 AM");

  // Book Visit Form State
  const [formCustomer, setFormCustomer] = useState("");
  const [formPhone, setFormPhone] = useState("+91 ");
  const [formProject, setFormProject] = useState("");
  const [formDate, setFormDate] = useState(todayStr);
  const [formTime, setFormTime] = useState("11:00 AM");
  const [formVisitors, setFormVisitors] = useState("2");
  const [formSalesperson, setFormSalesperson] = useState("Vikram Sharma (Senior CRM)");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<SiteVisitStatus>("Scheduled");

  const { monthName, calendarDays, paddingDays } = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
    const name = monthFormatter.format(new Date(calYear, calMonth, 1));

    const monthStr = String(calMonth + 1).padStart(2, "0");
    const days = Array.from({ length: daysInCurrentMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${calYear}-${monthStr}-${String(dayNum).padStart(2, "0")}`;
      return { day: dayNum, dateStr };
    });

    return {
      monthName: name,
      calendarDays: days,
      paddingDays: Array.from({ length: firstDayIndex }, (_, i) => i),
    };
  }, [calYear, calMonth]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const projectNames = useMemo(
    () => ["All projects", ...Array.from(new Set(visits.map((v) => v.project).filter(Boolean)))],
    [visits],
  );

  // Filtered visits
  const filtered = useMemo(() => {
    return visits.filter((v) => {
      const matchProject = projectFilter === "All projects" || v.project === projectFilter;
      const matchStatus = statusFilter === "All statuses" || v.status === statusFilter;
      const matchQuery =
        v.customer.toLowerCase().includes(query.toLowerCase()) ||
        v.phone.includes(query) ||
        v.project.toLowerCase().includes(query.toLowerCase()) ||
        v.salesperson.toLowerCase().includes(query.toLowerCase());
      return matchProject && matchStatus && matchQuery;
    });
  }, [visits, projectFilter, statusFilter, query]);

  // Visits map for calendar
  const visitsByDate = useMemo(() => {
    const map: Record<string, SiteVisit[]> = {};
    for (const v of visits) {
      (map[v.date] ??= []).push(v);
    }
    return map;
  }, [visits]);

  // Visits on selected calendar date
  const selectedDateVisits = useMemo(() => {
    return visits.filter((v) => v.date === selectedDate);
  }, [visits, selectedDate]);

  // Actions
  const handleConfirm = (id: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "Confirmed" as SiteVisitStatus } : v)),
    );
    if (selected?.id === id) {
      setSelected({ ...selected, status: "Confirmed" });
    }
  };

  const handleMarkCompleted = (id: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "Completed" as SiteVisitStatus } : v)),
    );
    if (selected?.id === id) {
      setSelected({ ...selected, status: "Completed" });
    }
  };

  const handleRescheduleSubmit = () => {
    if (!reschedulingVisit) return;
    setVisits((prev) =>
      prev.map((v) =>
        v.id === reschedulingVisit.id
          ? {
              ...v,
              date: rescheduleDate,
              time: rescheduleTime,
              status: "Rescheduled" as SiteVisitStatus,
              notes: `${v.notes ? v.notes + " · " : ""}Rescheduled to ${rescheduleDate} at ${rescheduleTime}.`,
            }
          : v,
      ),
    );
    if (selected?.id === reschedulingVisit.id) {
      setSelected({
        ...selected,
        date: rescheduleDate,
        time: rescheduleTime,
        status: "Rescheduled",
      });
    }
    setReschedulingVisit(null);
  };

  const handleCancelSubmit = () => {
    if (!cancellingVisit) return;
    setVisits((prev) =>
      prev.map((v) =>
        v.id === cancellingVisit.id
          ? {
              ...v,
              status: "Cancelled" as SiteVisitStatus,
              notes: `${v.notes ? v.notes + " · " : ""}Cancelled: ${cancelReason || "Buyer requested cancellation."}`,
            }
          : v,
      ),
    );
    if (selected?.id === cancellingVisit.id) {
      setSelected({ ...selected, status: "Cancelled" });
    }
    setCancellingVisit(null);
    setCancelReason("");
  };

  const handleCreateVisit = () => {
    if (!formCustomer.trim()) return;
    const newVisit: SiteVisit = {
      id: `sv-${Date.now()}`,
      customer: formCustomer.trim(),
      phone: formPhone.trim(),
      project: formProject.trim() || "General Property Visit",
      date: formDate || todayStr,
      time: formTime || "11:00 AM",
      visitors: parseInt(formVisitors, 10) || 2,
      salesperson: formSalesperson || "Vikram Sharma (Senior CRM)",
      status: formStatus,
      notes: formNotes || "Booked through AI Calling Assistant.",
    };
    setVisits((prev) => [newVisit, ...prev]);
    setIsBookModalOpen(false);
    setFormCustomer("");
    setFormPhone("+91 ");
    setFormProject("");
    setFormDate(todayStr);
    setFormNotes("");
  };

  return (
    <AppShell
      title="Property Site Visits"
      subtitle="Calendar tracking, buyer receptions, confirmations, and in-person walkthroughs"
      actions={
        <ButtonAzure
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 font-semibold shadow-xs hover:shadow transition-all"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Book Site Visit</span>
        </ButtonAzure>
      }
    >
      <SectionTabs section="crm" />

      {/* Top Controls: Filter & View Toggle */}
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-3" delay={0}>
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sub/70 pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buyer, phone, project, salesperson…"
              className="w-full rounded-xl border border-line bg-white/90 pl-9 pr-8 py-2 text-xs font-medium text-ink placeholder:text-sub/60 outline-none transition-all focus:border-azure/50 focus:bg-white focus:ring-2 focus:ring-azure/15"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-sub/70 hover:bg-black/5 hover:text-ink transition-colors"
                title="Clear search"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="appearance-none rounded-xl border border-line bg-white/90 pl-3 pr-8 py-2 text-xs font-medium text-ink outline-none transition-all focus:border-azure/50 focus:bg-white focus:ring-2 focus:ring-azure/15 cursor-pointer shadow-2xs"
            >
              {projectNames.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub/70"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none rounded-xl border border-line bg-white/90 pl-3 pr-8 py-2 text-xs font-medium text-ink outline-none transition-all focus:border-azure/50 focus:bg-white focus:ring-2 focus:ring-azure/15 cursor-pointer shadow-2xs"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub/70"
            />
          </div>

          {(query || projectFilter !== "All projects" || statusFilter !== "All statuses") && (
            <button
              onClick={() => {
                setQuery("");
                setProjectFilter("All projects");
                setStatusFilter("All statuses");
              }}
              className="rounded-xl border border-line/80 bg-canvas/60 px-2.5 py-2 text-xs font-medium text-sub hover:bg-white hover:text-ink transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* View Switcher: Ultra-Premium Segmented Pill */}
        <div
          role="tablist"
          aria-label="Site visits view"
          className="inline-flex items-center gap-1 rounded-2xl border border-line/80 bg-canvas/90 p-1 shadow-inner backdrop-blur-md transition-all shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "calendar"}
            onClick={() => setViewMode("calendar")}
            className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 select-none cursor-pointer ${
              viewMode === "calendar"
                ? "bg-white text-azure shadow-xs ring-1 ring-black/[0.06]"
                : "text-sub hover:text-ink hover:bg-white/60"
            }`}
          >
            <CalendarDays
              size={15}
              strokeWidth={viewMode === "calendar" ? 2.2 : 1.9}
              className={`shrink-0 transition-colors ${
                viewMode === "calendar" ? "text-azure" : "text-sub/70 group-hover:text-ink"
              }`}
            />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 select-none cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-azure shadow-xs ring-1 ring-black/[0.06]"
                : "text-sub hover:text-ink hover:bg-white/60"
            }`}
          >
            <LayoutList
              size={15}
              strokeWidth={viewMode === "list" ? 2.2 : 1.9}
              className={`shrink-0 transition-colors ${
                viewMode === "list" ? "text-azure" : "text-sub/70 group-hover:text-ink"
              }`}
            />
            <span>List View</span>
          </button>
        </div>
      </Panel>

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Month Calendar Grid */}
          <Panel className="p-4 lg:col-span-2 space-y-3.5" delay={60}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-3">
              <h2 className="text-base font-bold tracking-tight text-ink">{monthName}</h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="rounded-lg border border-line bg-white/90 p-1.5 text-sub hover:border-azure/40 hover:text-azure transition-colors shadow-2xs"
                  title="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="rounded-lg border border-line bg-white/90 p-1.5 text-sub hover:border-azure/40 hover:text-azure transition-colors shadow-2xs"
                  title="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] uppercase tracking-wider text-sub">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {paddingDays.map((padIdx) => (
                <div
                  key={`pad-${padIdx}`}
                  className="min-h-[76px] rounded-xl border border-transparent bg-transparent opacity-0 pointer-events-none"
                />
              ))}
              {calendarDays.map(({ day, dateStr }) => {
                const dayVisits = visitsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`group min-h-[76px] rounded-xl border p-2 text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                      isSelected
                        ? "border-azure bg-azure/[0.08] ring-2 ring-azure/25 shadow-xs"
                        : dayVisits.length > 0
                        ? "border-line bg-white/95 hover:border-azure/40 hover:shadow-xs hover:-translate-y-0.5"
                        : "border-line/60 bg-white/40 hover:bg-white/90 hover:border-line"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono text-xs font-bold transition-colors ${
                          isSelected
                            ? "text-azure"
                            : isToday
                            ? "text-azure underline decoration-2 decoration-azure underline-offset-2"
                            : "text-ink group-hover:text-azure"
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="rounded-sm bg-azure/15 px-1 py-0.2 font-mono text-[9px] font-bold text-azure uppercase">
                          Today
                        </span>
                      )}
                      {!isToday && dayVisits.length > 0 && (
                        <span className="size-1.5 rounded-full bg-azure" />
                      )}
                    </div>

                    {/* Dots / badges for visits */}
                    {dayVisits.length > 0 ? (
                      <div className="space-y-1 mt-1 w-full">
                        {dayVisits.slice(0, 2).map((v) => {
                          const isConfirmed = v.status === "Confirmed";
                          return (
                            <div
                              key={v.id}
                              className={`truncate rounded-md px-1.5 py-0.5 font-mono text-[9px] flex items-center gap-1 transition-all ${
                                isConfirmed
                                  ? "bg-good/15 text-good border border-good/25 font-semibold"
                                  : "bg-azure/10 text-azure border border-azure/20 font-medium"
                              }`}
                              title={`${v.time} · ${v.customer} (${v.project})`}
                            >
                              <span
                                className={`size-1 rounded-full shrink-0 ${
                                  isConfirmed ? "bg-good" : "bg-azure"
                                }`}
                              />
                              <span className="font-bold">{v.time.split(" ")[0]}</span>
                              <span className="truncate">{v.customer.split(" ")[0]}</span>
                            </div>
                          );
                        })}
                        {dayVisits.length > 2 && (
                          <div className="font-mono text-[9px] font-semibold text-sub/80 pl-1">
                            +{dayVisits.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Daily Visits Sidebar */}
          <Panel className="p-4 space-y-3.5" delay={120}>
            <div className="border-b border-line/70 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-azure/10 text-azure">
                    <CalendarClock size={15} />
                  </div>
                  <Label>Daily Schedule</Label>
                </div>
                <Badge tone="azure">
                  {new Date(selectedDate).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">
                  {selectedDateVisits.length} Visit{selectedDateVisits.length === 1 ? "" : "s"} Scheduled
                </h3>
                <span className="font-mono text-[11px] text-sub">
                  {selectedDateVisits.filter((v) => v.status === "Confirmed").length} confirmed
                </span>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {selectedDateVisits.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className="group cursor-pointer rounded-2xl border border-line bg-white/90 p-3.5 shadow-xs hover:border-azure/50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-ink group-hover:text-azure transition-colors">
                        {v.customer}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-sub mt-0.5">
                        <Building2 size={12} className="text-sub/70 shrink-0" />
                        <span>{v.project}</span>
                      </div>
                    </div>
                    <Badge tone={visitStatusTone(v.status)}>{v.status}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/60 pt-2.5 font-mono text-xs text-sub">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-azure shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-sub/70 block">Time</span>
                        <span className="font-bold text-ink">{v.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-good shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-sub/70 block">Host</span>
                        <span className="truncate block font-medium text-ink">
                          {v.salesperson.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-3 flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {v.status === "Scheduled" && (
                      <button
                        type="button"
                        onClick={() => handleConfirm(v.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-good/10 px-2.5 py-1.5 text-xs font-semibold text-good ring-1 ring-good/20 hover:bg-good/20 transition-colors shadow-2xs"
                      >
                        <Check size={13} strokeWidth={2.5} />
                        <span>Confirm</span>
                      </button>
                    )}
                    {v.status !== "Completed" && v.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(v.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-azure/10 px-2.5 py-1.5 text-xs font-semibold text-azure ring-1 ring-azure/20 hover:bg-azure/20 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 size={13} strokeWidth={2} />
                        <span>Completed</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReschedulingVisit(v)}
                      className="rounded-lg border border-line bg-canvas/60 px-2.5 py-1.5 text-xs font-medium text-sub hover:bg-white hover:text-ink transition-colors shadow-2xs"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}

              {selectedDateVisits.length === 0 && (
                <div className="py-12 text-center text-xs text-sub border border-dashed border-line rounded-xl space-y-2">
                  <CalendarDays size={24} className="mx-auto text-sub/50" />
                  <p>No property visits scheduled on this date.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDate(selectedDate);
                      setIsBookModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-azure/10 px-2.5 py-1 font-semibold text-azure hover:bg-azure/20 transition-colors"
                  >
                    <Plus size={13} />
                    <span>Book visit for this day</span>
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <Panel className="overflow-hidden" delay={60}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-line/70 font-mono text-[10px] uppercase tracking-[0.16em] text-sub">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Date & Time</th>
                  <th className="px-4 py-3 font-medium">Visitors</th>
                  <th className="px-4 py-3 font-medium">Salesperson</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className="cursor-pointer transition-colors hover:bg-azure/5"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-azure/10 text-azure font-bold text-xs ring-1 ring-azure/20">
                          {v.customer
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-ink">{v.customer}</div>
                          <div className="font-mono text-xs text-sub">{v.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-sub">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-sub/70 shrink-0" />
                        <span>{v.project}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <div className="font-bold text-ink">{v.date}</div>
                      <div className="text-sub flex items-center gap-1 mt-0.5">
                        <Clock size={11} className="text-azure" />
                        <span>{v.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-sub">
                      <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 font-mono">
                        <Users size={12} className="text-sub/70" />
                        {v.visitors}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-ink">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-sub/70" />
                        <span>{v.salesperson}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={visitStatusTone(v.status)}>{v.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === "Scheduled" && (
                          <button
                            type="button"
                            onClick={() => handleConfirm(v.id)}
                            className="flex items-center gap-1 rounded-lg bg-good/10 px-2.5 py-1 text-xs font-semibold text-good ring-1 ring-good/20 hover:bg-good/20 transition-colors shadow-2xs"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>Confirm</span>
                          </button>
                        )}
                        {v.status !== "Completed" && v.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(v.id)}
                            className="flex items-center gap-1 rounded-lg bg-azure/10 px-2.5 py-1 text-xs font-semibold text-azure ring-1 ring-azure/20 hover:bg-azure/20 transition-colors shadow-2xs"
                          >
                            <CheckCircle2 size={12} strokeWidth={2} />
                            <span>Done</span>
                          </button>
                        )}
                        <ButtonGhost
                          onClick={() => setReschedulingVisit(v)}
                          className="px-2 py-1 text-xs"
                        >
                          Reschedule
                        </ButtonGhost>
                        {v.status !== "Cancelled" && (
                          <ButtonGhost
                            onClick={() => setCancellingVisit(v)}
                            className="px-2 py-1 text-xs text-bad hover:bg-bad/10"
                          >
                            Cancel
                          </ButtonGhost>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-sub">
                      {visits.length === 0
                        ? "No site visits booked yet. Click '+ Book Site Visit' to schedule an in-person tour."
                        : "No site visits match your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* BOOK SITE VISIT MODAL */}
      <Modal
        open={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Property Site Visit"
        footer={
          <>
            <ButtonGhost onClick={() => setIsBookModalOpen(false)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleCreateVisit}>Confirm Booking</ButtonAzure>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <Label>Customer Name</Label>
            <input
              type="text"
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
              placeholder="e.g. Priya Menon"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
          <div>
            <Label>Phone Contact</Label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+91 98000 00000"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none font-mono focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Property Project</Label>
            <input
              type="text"
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
              placeholder="e.g. Riverside Heights"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Party / Visitor Size</Label>
            <input
              type="number"
              min={1}
              max={20}
              value={formVisitors}
              onChange={(e) => setFormVisitors(e.target.value)}
              placeholder="2"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Date (YYYY-MM-DD)</Label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Visit Time Slot</Label>
            <input
              type="text"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              placeholder="11:00 AM"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Sales Host / Hostess</Label>
            <select
              value={formSalesperson}
              onChange={(e) => setFormSalesperson(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            >
              <option>Vikram Sharma (Senior CRM)</option>
              <option>Anika Rao (Project Lead)</option>
              <option>Sneha Patil (Client Relations)</option>
              <option>Rohan Mehta (Sales Executive)</option>
            </select>
          </div>

          <div>
            <Label>Booking Status</Label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as SiteVisitStatus)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label>Reception Special Requests / Notes</Label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Sample flat walkthrough, clubhouse tour, chauffeur gate pass..."
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
        </div>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal
        open={reschedulingVisit !== null}
        onClose={() => setReschedulingVisit(null)}
        title={
          reschedulingVisit
            ? `Reschedule Visit for ${reschedulingVisit.customer}`
            : "Reschedule Visit"
        }
        footer={
          <>
            <ButtonGhost onClick={() => setReschedulingVisit(null)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleRescheduleSubmit}>Save New Slot</ButtonAzure>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-sub text-xs">
            Current slot:{" "}
            <strong className="text-ink">
              {reschedulingVisit?.date} at {reschedulingVisit?.time}
            </strong>
          </p>
          <div>
            <Label>New Date (YYYY-MM-DD)</Label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
          <div>
            <Label>New Time Slot</Label>
            <input
              type="text"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              placeholder="11:30 AM"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
        </div>
      </Modal>

      {/* CANCEL MODAL */}
      <Modal
        open={cancellingVisit !== null}
        onClose={() => setCancellingVisit(null)}
        title="Cancel Site Visit"
        footer={
          <>
            <ButtonGhost onClick={() => setCancellingVisit(null)}>Back</ButtonGhost>
            <button
              type="button"
              onClick={handleCancelSubmit}
              className="rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white hover:bg-bad/90 transition-colors"
            >
              Confirm Cancellation
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-sub">
            Are you sure you want to cancel the site visit for{" "}
            <strong className="text-ink">{cancellingVisit?.customer}</strong>?
          </p>
          <div>
            <Label>Cancellation Reason</Label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Purchased elsewhere, budget mismatch, relocated..."
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
        </div>
      </Modal>

      {/* DRAWER DETAILS */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.customer ?? ""}
        subtitle={selected ? `${selected.phone} · ${selected.project}` : undefined}
        footer={
          <div className="flex gap-2">
            <ButtonGhost className="flex-1" onClick={() => setSelected(null)}>
              Close
            </ButtonGhost>
            {selected && selected.status === "Scheduled" && (
              <ButtonAzure
                className="flex-1"
                onClick={() => {
                  handleConfirm(selected.id);
                  setSelected(null);
                }}
              >
                Confirm Visit
              </ButtonAzure>
            )}
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={visitStatusTone(selected.status)}>{selected.status}</Badge>
              <span className="font-mono text-xs text-sub">{selected.project}</span>
            </div>

            <div className="rounded-xl border border-line/70 bg-canvas/60 p-3.5 space-y-2">
              <Label>Visit Schedule</Label>
              <div className="font-mono text-sm font-bold text-ink flex items-center gap-1.5">
                <Clock size={14} className="text-azure" />
                <span>
                  {selected.date} · {selected.time}
                </span>
              </div>
              <div className="text-xs text-sub flex items-center gap-1.5">
                <Users size={13} className="text-sub/70" />
                <span>Party size: {selected.visitors} Adults</span>
              </div>
            </div>

            <div className="rounded-xl border border-line/70 bg-white p-3 space-y-2 text-xs">
              <Label>Assigned Sales Host</Label>
              <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                <User size={14} className="text-good" />
                <span>{selected.salesperson}</span>
              </div>
              <div className="text-sub">
                Assigned to guide sample flat and amenities presentation
              </div>
            </div>

            <div>
              <Label>Special Notes & Requests</Label>
              <p className="mt-1 rounded-lg border border-line bg-canvas/60 p-3 text-xs leading-relaxed text-sub">
                {selected.notes}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <ButtonGhost
                onClick={() => {
                  const toReschedule = selected;
                  setSelected(null);
                  setReschedulingVisit(toReschedule);
                }}
                className="flex-1"
              >
                Reschedule
              </ButtonGhost>
              {selected.status !== "Cancelled" && (
                <ButtonGhost
                  onClick={() => {
                    const toCancel = selected;
                    setSelected(null);
                    setCancellingVisit(toCancel);
                  }}
                  className="text-bad hover:bg-bad/10"
                >
                  Cancel Visit
                </ButtonGhost>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
