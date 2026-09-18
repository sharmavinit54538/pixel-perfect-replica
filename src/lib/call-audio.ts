// Dual Tone Multi-Frequency (DTMF) frequencies for keypad 0-9, *, #
const DTMF_FREQS: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play an authentic DTMF keypad tone when tapping 0-9, *, #
 */
export function playDtmfTone(digit: string, durationMs = 120) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;

    const [f1, f2] = freqs;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = f1;
    osc2.frequency.value = f2;
    osc1.type = "sine";
    osc2.type = "sine";

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + durationMs / 1000);
    osc2.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    console.debug("Audio play failed:", err);
  }
}

/**
 * Play phone ringback tone ("Tring tring...")
 */
export function playRingbackTone(): () => void {
  let isStopped = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const playOneBurst = () => {
    if (isStopped) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      osc1.type = "sine";
      osc2.type = "sine";

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);
    } catch {
      // ignore
    }
  };

  playOneBurst();
  intervalId = setInterval(playOneBurst, 3000);

  return () => {
    isStopped = true;
    if (intervalId) clearInterval(intervalId);
  };
}

/**
 * Speak dialogue live using Web Speech API so the user can listen in to the ongoing call
 */
export function speakLiveText(
  text: string,
  speaker: "agent" | "customer",
  options?: {
    volume?: number;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }
): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    // Fallback if speech synthesis not available
    const timeout = setTimeout(() => {
      options?.onStart?.();
      setTimeout(() => options?.onEnd?.(), 2500);
    }, 100);
    return () => clearTimeout(timeout);
  }

  // Cancel any active speech before starting new phrase
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = options?.volume ?? 1;
  utterance.rate = options?.rate ?? (speaker === "agent" ? 1.05 : 0.98);
  utterance.pitch = speaker === "agent" ? 1.2 : 0.9;

  // Try to find natural voices
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    if (speaker === "agent") {
      // Prefer female / natural English voice for Aria
      const agentVoice =
        voices.find(
          (v) =>
            v.name.includes("Female") ||
            v.name.includes("Zira") ||
            v.name.includes("Aria") ||
            (v.lang.startsWith("en") && v.name.includes("Google") && !v.name.includes("Male"))
        ) ||
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (agentVoice) utterance.voice = agentVoice;
    } else {
      // Customer voice: distinct tone (male/deeper or alternate)
      const customerVoice =
        voices.find(
          (v) =>
            v.name.includes("Male") ||
            v.name.includes("David") ||
            v.name.includes("Ravi") ||
            v.name.includes("George")
        ) ||
        voices.find((v) => v.lang.startsWith("en-GB") || v.lang.startsWith("en-US")) ||
        voices[0];
      if (customerVoice) utterance.voice = customerVoice;
    }
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    options?.onEnd?.();
  };

  utterance.onerror = () => {
    options?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopLiveSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
