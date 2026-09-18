import type { Call, CallStatus, CallTranscriptItem } from "@/types";
import { playDtmfTone, playRingbackTone, speakLiveText, stopLiveSpeech } from "./call-audio";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  project: string;
  budget: string;
  status: "Hot" | "Warm" | "Cold" | "Interested";
  avatarColor: string;
}

export interface CallSummaryData {
  qualificationScore: number;
  sentiment: "Positive" | "Neutral" | "Needs Nurturing";
  preferredConfig: string;
  budgetRange: string;
  keyDiscussion: string[];
  nextAction: string;
  scheduledSlot?: string;
}

export interface ActiveCallState {
  status: "idle" | "dialing" | "ringing" | "connected" | "ended";
  phoneNumber: string;
  contactName: string;
  projectName: string;
  durationSeconds: number;
  currentSpeaker: "agent" | "customer" | "none";
  currentSpeechText: string;
  transcript: CallTranscriptItem[];
  summary: CallSummaryData | null;
  listenLive: boolean;
  volume: number;
  callId: string;
}

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "c-1",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    project: "Godrej Horizon · Bangalore",
    budget: "₹1.4 – 1.6 Cr",
    status: "Hot",
    avatarColor: "bg-blue-600",
  },
  {
    id: "c-2",
    name: "Priya Nair",
    phone: "+91 98234 56789",
    project: "Prestige Falcon City · Kanakapura",
    budget: "₹2.0 – 2.4 Cr",
    status: "Warm",
    avatarColor: "bg-emerald-600",
  },
  {
    id: "c-3",
    name: "Amit Patel",
    phone: "+91 99102 34567",
    project: "DLF Alameda · Gurgaon",
    budget: "₹3.5 – 4.2 Cr",
    status: "Hot",
    avatarColor: "bg-indigo-600",
  },
  {
    id: "c-4",
    name: "Sneha Reddy",
    phone: "+91 97410 88990",
    project: "Brigade Gateway · Rajajinagar",
    budget: "₹1.2 – 1.5 Cr",
    status: "Interested",
    avatarColor: "bg-rose-600",
  },
  {
    id: "c-5",
    name: "Vikram Verma",
    phone: "+91 98110 55443",
    project: "Sobha Neopolis · Panathur",
    budget: "₹2.5 – 2.9 Cr",
    status: "Warm",
    avatarColor: "bg-amber-600",
  },
  {
    id: "c-6",
    name: "Sunita Mehta",
    phone: "+91 98450 12345",
    project: "Lodha Crown · Thane",
    budget: "₹85 L – 1.1 Cr",
    status: "Interested",
    avatarColor: "bg-teal-600",
  },
];

// Conversational scenarios dynamically tailored to customer name & project
export function generateCallScript(customerName: string, projectName: string, customGreeting?: string): {
  dialogues: CallTranscriptItem[];
  summary: CallSummaryData;
  outcomeStatus: CallStatus;
} {
  const firstName = customerName.split(" ")[0] || "there";
  const projectBase = projectName.split(" · ")[0] || "the project";

  const greetingLine = customGreeting
    ? customGreeting
        .replace("{{name}}", firstName)
        .replace("{{project}}", projectBase)
        .replace("{{price}}", "₹1.4 Cr")
    : `Hello ${firstName}, good morning! This is Aria from Tutu Voice Assistant calling regarding your enquiry for ${projectBase}. Do you have a quick minute?`;

  return {
    dialogues: [
      {
        speaker: "agent",
        text: greetingLine,
      },
      {
        speaker: "customer",
        text: `Yes, hi Aria. I was browsing ${projectBase} yesterday. Could you tell me about the 2 and 3 BHK possession dates?`,
      },
      {
        speaker: "agent",
        text: `Certainly ${firstName}! Phase 1 is ready for fit-outs by December 2026, and Phase 2 is slated for mid-2027. We also have an exclusive pre-launch pricing benefit on 3 BHK corner units this week.`,
      },
      {
        speaker: "customer",
        text: `That sounds good. What is the starting price for the 3 BHK, and what about car parking and club amenities?`,
      },
      {
        speaker: "agent",
        text: `3 BHK units start at ₹1.45 Crores all-inclusive, with two covered basement parkings and clubhouse membership included. Would you like to schedule an on-site visit or a 3D virtual tour this Saturday?`,
      },
      {
        speaker: "customer",
        text: `Saturday afternoon around 3:30 PM works great for me. Please send the location map and brochure on my WhatsApp.`,
      },
      {
        speaker: "agent",
        text: `Perfect! I have reserved your site visit for Saturday at 3:30 PM, and our relationship manager will meet you at the experience center. I am sending the detailed brochure on your WhatsApp right away. Have a wonderful day!`,
      },
    ],
    summary: {
      qualificationScore: 94,
      sentiment: "Positive",
      preferredConfig: "3 BHK Corner Unit",
      budgetRange: "₹1.4 – 1.6 Cr",
      keyDiscussion: [
        `Inquired about Phase 1 possession dates (Dec 2026) and 3 BHK corner units`,
        `Clarified car parking inclusion and clubhouse access amenities`,
        `Requested WhatsApp brochure and location pin`,
      ],
      nextAction: `Confirmed In-Person Site Visit for Saturday @ 3:30 PM. Brochure dispatched via WhatsApp.`,
      scheduledSlot: "Saturday, 3:30 PM",
    },
    outcomeStatus: "Interested",
  };
}

// Global state variables
let activeCall: ActiveCallState = {
  status: "idle",
  phoneNumber: "",
  contactName: "",
  projectName: "",
  durationSeconds: 0,
  currentSpeaker: "none",
  currentSpeechText: "",
  transcript: [],
  summary: null,
  listenLive: true,
  volume: 1,
  callId: "",
};

let dialerModalOpen = false;
let stopRingingCallback: (() => void) | null = null;
let stopSpeechCallback: (() => void) | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let callStepTimeout: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeCallStore(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getActiveCallState(): ActiveCallState {
  return activeCall;
}

export function isDialerOpen(): boolean {
  return dialerModalOpen;
}

export function setDialerOpen(open: boolean) {
  dialerModalOpen = open;
  notify();
}

export function updateCallVolume(volume: number) {
  activeCall.volume = Math.max(0, Math.min(1, volume));
  notify();
}

export function toggleListenLive() {
  activeCall.listenLive = !activeCall.listenLive;
  if (!activeCall.listenLive) {
    stopLiveSpeech();
  }
  notify();
}

// Call history storage
const STORAGE_KEY = "tutu_call_assistant_records_v1";

export function getSavedCalls(): Call[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialDemoCalls();
    return JSON.parse(raw);
  } catch {
    return getInitialDemoCalls();
  }
}

export function saveCallToHistory(call: Call) {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedCalls();
    const updated = [call, ...current.filter((c) => c.id !== call.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function getInitialDemoCalls(): Call[] {
  return [
    {
      id: "call-901",
      customer: "Rahul Sharma",
      number: "+91 98765 43210",
      project: "Godrej Horizon · Bangalore",
      status: "Interested",
      duration: "01:45",
      date: "Today",
      time: "11:30 AM",
      transcript: [
        {
          speaker: "agent",
          text: "Hello Rahul, good morning! This is Aria from Tutu Voice Assistant calling regarding your enquiry for Godrej Horizon.",
        },
        {
          speaker: "customer",
          text: "Hi Aria, yes I wanted to know if 3 BHK units are available on upper floors.",
        },
        {
          speaker: "agent",
          text: "Yes, we have 3 BHK units from floor 12 and above with unobstructed lake views. Would Saturday work for a site visit?",
        },
        {
          speaker: "customer",
          text: "Yes, Saturday afternoon would be great. Please send me the brochure on WhatsApp.",
        },
        {
          speaker: "agent",
          text: "Confirmed! I've booked your site visit for Saturday 3:30 PM. Have a great day!",
        },
      ],
    },
    {
      id: "call-902",
      customer: "Priya Nair",
      number: "+91 98234 56789",
      project: "Prestige Falcon City · Kanakapura",
      status: "Follow-up",
      duration: "01:12",
      date: "Yesterday",
      time: "04:15 PM",
      transcript: [
        {
          speaker: "agent",
          text: "Hello Priya, this is Aria from Prestige Falcon City. Calling to follow up on your floor plan inquiry.",
        },
        {
          speaker: "customer",
          text: "I am currently traveling. Please call me back on Thursday after 5 PM.",
        },
        {
          speaker: "agent",
          text: "Understood Priya. I have scheduled a callback for Thursday at 5 PM. Thank you!",
        },
      ],
    },
    {
      id: "call-903",
      customer: "Amit Patel",
      number: "+91 99102 34567",
      project: "DLF Alameda · Gurgaon",
      status: "Interested",
      duration: "02:18",
      date: "Sep 13",
      time: "02:40 PM",
      transcript: [
        {
          speaker: "agent",
          text: "Hello Amit, Aria here from DLF Alameda. You enquired about luxury 4 BHK floor plans.",
        },
        {
          speaker: "customer",
          text: "Yes, I am looking for an immediate possession villa or luxury floor.",
        },
        {
          speaker: "agent",
          text: "We have two ready-to-move corner plots with private lifts available. Can I connect you with our senior property consultant?",
        },
        {
          speaker: "customer",
          text: "Yes, please connect them right away or have them WhatsApp me the layout.",
        },
      ],
    },
  ];
}

/**
 * Start a live call to a phone number or contact
 */
export function startCall(phoneNumber: string, contactName?: string, projectName?: string, customGreeting?: string) {
  // Clean up any ongoing call
  endCall(false);

  const matchedContact = DEFAULT_CONTACTS.find(
    (c) => c.phone.replace(/\D/g, "").slice(-10) === phoneNumber.replace(/\D/g, "").slice(-10)
  );

  const finalName = contactName || matchedContact?.name || "Customer";
  const finalProject = projectName || matchedContact?.project || "Godrej Horizon · Bangalore";
  const callId = `call-${Date.now().toString().slice(-4)}`;

  activeCall = {
    status: "dialing",
    phoneNumber,
    contactName: finalName,
    projectName: finalProject,
    durationSeconds: 0,
    currentSpeaker: "none",
    currentSpeechText: "",
    transcript: [],
    summary: null,
    listenLive: activeCall.listenLive,
    volume: activeCall.volume,
    callId,
  };
  dialerModalOpen = true;
  notify();

  // Step 1: Dialing for 1.2s then Ringing
  callStepTimeout = setTimeout(() => {
    activeCall.status = "ringing";
    notify();

    // Play ringback tone
    stopRingingCallback = playRingbackTone();

    // Ringing for ~3.2 seconds then Answer
    callStepTimeout = setTimeout(() => {
      if (stopRingingCallback) {
        stopRingingCallback();
        stopRingingCallback = null;
      }

      activeCall.status = "connected";
      notify();

      // Start call duration timer
      timerInterval = setInterval(() => {
        activeCall.durationSeconds += 1;
        notify();
      }, 1000);

      // Execute conversation dialogues sequence
      const script = generateCallScript(finalName, finalProject, customGreeting);
      executeDialogueStep(script.dialogues, 0, script.summary, script.outcomeStatus);
    }, 3200);
  }, 1200);
}

function executeDialogueStep(
  dialogues: CallTranscriptItem[],
  index: number,
  finalSummary: CallSummaryData,
  outcomeStatus: CallStatus
) {
  if (activeCall.status !== "connected") return;

  if (index >= dialogues.length) {
    // Conversation finished naturally: wait 2s then wrap up
    callStepTimeout = setTimeout(() => {
      wrapUpCall(finalSummary, outcomeStatus);
    }, 2000);
    return;
  }

  const currentItem = dialogues[index]!;
  activeCall.currentSpeaker = currentItem.speaker;
  activeCall.currentSpeechText = currentItem.text;
  activeCall.transcript = [...activeCall.transcript, currentItem];
  notify();

  // Speak live text if listening is enabled
  if (activeCall.listenLive) {
    stopSpeechCallback = speakLiveText(currentItem.text, currentItem.speaker, {
      volume: activeCall.volume,
      onEnd: () => {
        // Natural pause before next person speaks
        callStepTimeout = setTimeout(() => {
          executeDialogueStep(dialogues, index + 1, finalSummary, outcomeStatus);
        }, 1100);
      },
    });
  } else {
    // Simulating natural speaking duration if speech muted
    const estimatedReadingMs = Math.max(2200, currentItem.text.split(" ").length * 360);
    callStepTimeout = setTimeout(() => {
      executeDialogueStep(dialogues, index + 1, finalSummary, outcomeStatus);
    }, estimatedReadingMs);
  }
}

function wrapUpCall(summary: CallSummaryData, outcomeStatus: CallStatus) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (stopRingingCallback) {
    stopRingingCallback();
    stopRingingCallback = null;
  }
  stopLiveSpeech();

  const mins = Math.floor(activeCall.durationSeconds / 60);
  const secs = activeCall.durationSeconds % 60;
  const durationStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  activeCall.status = "ended";
  activeCall.currentSpeaker = "none";
  activeCall.currentSpeechText = "";
  activeCall.summary = summary;
  notify();

  // Format today's time
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const record: Call = {
    id: activeCall.callId,
    customer: activeCall.contactName,
    number: activeCall.phoneNumber,
    project: activeCall.projectName,
    status: outcomeStatus,
    duration: durationStr || "00:45",
    date: "Today",
    time: timeStr,
    transcript: activeCall.transcript,
  };

  saveCallToHistory(record);
}

/**
 * End an active call manually
 */
export function endCall(saveRecord = true) {
  if (callStepTimeout) {
    clearTimeout(callStepTimeout);
    callStepTimeout = null;
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (stopRingingCallback) {
    stopRingingCallback();
    stopRingingCallback = null;
  }
  stopLiveSpeech();

  if (activeCall.status === "connected" && saveRecord) {
    const defaultSummary: CallSummaryData = {
      qualificationScore: 88,
      sentiment: "Positive",
      preferredConfig: "2 / 3 BHK",
      budgetRange: "₹1.4 – 1.8 Cr",
      keyDiscussion: ["Call ended early by user", "Greeting and project inquiry established"],
      nextAction: "Callback scheduled for lead re-qualification",
    };
    wrapUpCall(defaultSummary, "Completed");
  } else {
    activeCall.status = "idle";
    activeCall.durationSeconds = 0;
    activeCall.currentSpeaker = "none";
    activeCall.currentSpeechText = "";
    notify();
  }
}

/**
 * Reset state to idle so user can place a new call
 */
export function resetDialer() {
  endCall(false);
  activeCall = {
    status: "idle",
    phoneNumber: "",
    contactName: "",
    projectName: "",
    durationSeconds: 0,
    currentSpeaker: "none",
    currentSpeechText: "",
    transcript: [],
    summary: null,
    listenLive: activeCall.listenLive,
    volume: activeCall.volume,
    callId: "",
  };
  notify();
}

export function playKeypadTone(digit: string) {
  playDtmfTone(digit);
}
