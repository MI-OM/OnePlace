/**
 * Sound manager using Web Audio API.
 * Generates tones programmatically — no audio files needed.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Preferences stored in localStorage */
const STORAGE_KEY = "oneplace_sound_prefs";

export type SoundPrefs = {
  ringing: boolean;       // customer: ringing while waiting for staff
  incomingCall: boolean;  // staff: incoming call ring
  callConnected: boolean; // both: tone when call connects
  callEnded: boolean;     // both: tone when call ends
  notification: boolean;  // both: notification bell tone
};

const DEFAULT_PREFS: SoundPrefs = {
  ringing: true,
  incomingCall: true,
  callConnected: true,
  callEnded: true,
  notification: true,
};

export function getSoundPrefs(): SoundPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function setSoundPrefs(prefs: SoundPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function isEnabled(key: keyof SoundPrefs): boolean {
  return getSoundPrefs()[key];
}

/** Short notification "ding" */
export function playNotification() {
  if (!isEnabled("notification")) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

/** Incoming call ring — repeated double-beep */
export function playIncomingCall(): (() => void) {
  if (!isEnabled("incomingCall")) return () => {};
  const ctx = getCtx();
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  function beep() {
    if (stopped) return;
    const now = ctx.currentTime;

    // First beep
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, now);
    g1.gain.setValueAtTime(0.25, now);
    g1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second beep (higher)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(554, now + 0.2);
    g2.gain.setValueAtTime(0.25, now + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.4);

    timeout = setTimeout(beep, 2000);
  }

  beep();

  return () => {
    stopped = true;
    if (timeout) clearTimeout(timeout);
  };
}

/** Ringing tone — customer waiting (continuous soft tone) */
export function playRinging(): (() => void) {
  if (!isEnabled("ringing")) return () => {};
  const ctx = getCtx();
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  function pulse() {
    if (stopped) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);

    timeout = setTimeout(pulse, 1500);
  }

  pulse();

  return () => {
    stopped = true;
    if (timeout) clearTimeout(timeout);
  };
}

/** Call connected — ascending two-note chime */
export function playConnected() {
  if (!isEnabled("callConnected")) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523, now); // C5
  g1.gain.setValueAtTime(0.3, now);
  g1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc1.connect(g1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(659, now + 0.15); // E5
  g2.gain.setValueAtTime(0.3, now + 0.15);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.5);
}

/** Call ended — descending two-note tone */
export function playEnded() {
  if (!isEnabled("callEnded")) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523, now);
  g1.gain.setValueAtTime(0.2, now);
  g1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  osc1.connect(g1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.25);

  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(392, now + 0.15); // G4
  g2.gain.setValueAtTime(0.2, now + 0.15);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.45);
}
