export type SoundName =
  | "tap"
  | "gold"
  | "purple"
  | "avoid"
  | "combo"
  | "gameover";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  getCtx();
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
  const t = audio.currentTime + start;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

export function playSound(name: SoundName) {
  switch (name) {
    case "tap":
      blip(660, 0, 0.09, "triangle", 0.16);
      break;
    case "gold":
      blip(784, 0, 0.09, "square", 0.12);
      blip(1046, 0.07, 0.1, "square", 0.12);
      blip(1318, 0.14, 0.16, "square", 0.12);
      break;
    case "purple":
      blip(520, 0, 0.07, "sawtooth", 0.1);
      blip(880, 0.08, 0.12, "sawtooth", 0.1);
      break;
    case "avoid":
      blip(420, 0, 0.13, "sine", 0.14, 700);
      break;
    case "combo":
      blip(600, 0, 0.08, "triangle", 0.13);
      blip(900, 0.08, 0.08, "triangle", 0.13);
      blip(1200, 0.16, 0.2, "triangle", 0.13);
      break;
    case "gameover":
      blip(320, 0, 0.35, "sawtooth", 0.16, 80);
      blip(160, 0.12, 0.4, "square", 0.1, 60);
      break;
  }
}
