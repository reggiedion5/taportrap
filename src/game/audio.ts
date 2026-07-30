export type SoundName =
  | "tap"
  | "gold"
  | "purple-first"
  | "purple-done"
  | "avoid"
  | "combo"
  | "levelup"
  | "gameover";

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value && ctx && ctx.state === "running") {
    void ctx.suspend().catch(() => {});
  }
}

/** Must be called from a user gesture (start / resume tap). */
export function unlockAudio() {
  if (!enabled) return;
  getCtx();
}

export function suspendAudio() {
  if (ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
}

export function resumeAudio() {
  if (!enabled) return;
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function blip(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
  slideTo?: number,
) {
  const audio = getCtx();
  if (!audio) return;
  try {
    const t = audio.currentTime + start;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    // release nodes as soon as the voice ends so nothing accumulates
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
    osc.start(t);
    osc.stop(t + duration + 0.03);
  } catch {
    /* audio must never break gameplay */
  }
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  switch (name) {
    case "tap":
      blip(660, 0, 0.09, "triangle", 0.14);
      break;
    case "gold":
      blip(784, 0, 0.09, "square", 0.11);
      blip(1046, 0.07, 0.1, "square", 0.11);
      blip(1318, 0.14, 0.15, "square", 0.1);
      break;
    case "purple-first":
      blip(430, 0, 0.05, "sine", 0.07);
      break;
    case "purple-done":
      blip(560, 0, 0.07, "sawtooth", 0.09);
      blip(900, 0.07, 0.12, "sawtooth", 0.09);
      break;
    case "avoid":
      blip(420, 0, 0.13, "sine", 0.12, 700);
      break;
    case "combo":
      blip(600, 0, 0.08, "triangle", 0.11);
      blip(900, 0.08, 0.08, "triangle", 0.11);
      blip(1200, 0.16, 0.18, "triangle", 0.11);
      break;
    case "levelup":
      blip(520, 0, 0.09, "square", 0.09);
      blip(780, 0.09, 0.09, "square", 0.09);
      blip(1040, 0.18, 0.2, "square", 0.09);
      break;
    case "gameover":
      blip(320, 0, 0.35, "sawtooth", 0.14, 80);
      blip(160, 0.12, 0.4, "square", 0.09, 60);
      break;
  }
}
