export type CallStatus = "Interested" | "Not Interested" | "Follow-up" | "Completed";
export type LeadStatus = "Hot" | "Warm" | "Cold" | "Closed";

export interface CallTranscriptItem {
  speaker: "agent" | "customer";
  text: string;
}

export interface Call {
  id: string;
  customer: string;
  number: string;
  project: string;
  status: CallStatus;
  duration: string;
  date: string;
  time: string;
  transcript: CallTranscriptItem[];
}

export type ProjectStatus = "Selling" | "Pre-launch" | "Sold out";

export interface Project {
  id: string;
  name: string;
  location: string;
  price: string;
  configuration: string;
  status: ProjectStatus;
  soldPercent: number;
  unitsNote: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  project: string;
  interest: "High" | "Medium" | "Low";
  budget: string;
  status: LeadStatus;
  followUp: string;
  notes: string;
}

export type CampaignStatus = "Active" | "Paused" | "Draft" | "Completed";

export interface Campaign {
  id: string;
  name: string;
  project: string;
  leadList: string;
  agent: string;
  callingHours: string;
  maxAttempts: number;
  retryInterval: string;
  followUpRules: string;
  languages: string[];
  status: CampaignStatus;
  totalLeads: number;
  dialed: number;
  connectedRate: number;
  qualifiedLeads: number;
  siteVisitsBooked: number;
  createdAt: string;
}

export type FollowUpStatus = "Today" | "Overdue" | "Upcoming" | "Completed";
export type FollowUpMethod = "AI Call" | "Phone Call" | "WhatsApp" | "Site Visit" | "Email";
export type Priority = "High" | "Medium" | "Low";

export interface FollowUp {
  id: string;
  leadName: string;
  phone: string;
  project: string;
  reason: string;
  date: string;
  time: string;
  method: FollowUpMethod;
  priority: Priority;
  assignedTo: string;
  notes: string;
  status: FollowUpStatus;
}

export type SiteVisitStatus = "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "Rescheduled";

export interface SiteVisit {
  id: string;
  customer: string;
  phone: string;
  project: string;
  date: string;
  time: string;
  visitors: number;
  salesperson: string;
  status: SiteVisitStatus;
  notes: string;
}

export type NotificationType =
  | "hot_lead"
  | "site_visit"
  | "human_handoff"
  | "callback"
  | "high_value"
  | "followup_due"
  | "failed_call";

export type NotificationPriority = "high" | "medium" | "low";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: NotificationPriority;
  linkTo?: string;
}
