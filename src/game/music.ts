/**
 * Chiptune background music, generated entirely in code.
 *
 * Uses its own AudioContext so the sound-effect toggle can suspend the SFX
 * context without silencing music (and vice versa). Everything fails silently:
 * music must never be able to break gameplay or the native iOS build.
 */

export type MusicTrack = "menu" | "game";

const LOOKAHEAD_MS = 25;
/** how far ahead of the clock notes are scheduled */
const SCHEDULE_AHEAD = 0.14;
const MASTER_GAIN = 0.16;

type Step = {
  /** semitone offsets, null = rest */
  bass: number | null;
  lead: number | null;
  hat: boolean;
  kick: boolean;
};

const ROOT = 110; // A2

const note = (semitone: number) => ROOT * Math.pow(2, semitone / 12);

function pattern(
  bass: (number | null)[],
  lead: (number | null)[],
  hats: number[],
  kicks: number[],
): Step[] {
  return Array.from({ length: 16 }, (_, i) => ({
    bass: bass[i] ?? null,
    lead: lead[i] ?? null,
    hat: hats.includes(i),
    kick: kicks.includes(i),
  }));
}

const _ = null;

/** Calm, floaty menu loop in A minor. */
const MENU_BARS: Step[][] = [
  pattern(
    [0, _, _, _, 0, _, _, _, -4, _, _, _, -4, _, _, _],
    [24, _, 28, _, 31, _, 28, _, 24, _, 27, _, 31, _, 27, _],
    [2, 6, 10, 14],
    [0, 8],
  ),
  pattern(
    [-2, _, _, _, -2, _, _, _, -5, _, _, _, -5, _, _, _],
    [26, _, 29, _, 33, _, 29, _, 22, _, 26, _, 29, _, 26, _],
    [2, 6, 10, 14],
    [0, 8],
  ),
];

/** Driving arcade loop: same key, busier bass and lead. */
const GAME_BARS: Step[][] = [
  pattern(
    [0, _, 0, _, 12, _, 0, _, 0, _, 0, _, 7, _, 5, _],
    [24, 28, 31, 36, 31, 28, 31, 36, 24, 28, 31, 36, 35, 31, 28, 24],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [0, 6, 8, 14],
  ),
  pattern(
    [-4, _, -4, _, 8, _, -4, _, -5, _, -5, _, 3, _, 2, _],
    [27, 31, 34, 39, 34, 31, 34, 39, 26, 29, 33, 38, 33, 29, 26, 22],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [0, 6, 8, 14],
  ),
  pattern(
    [0, _, 0, _, 12, _, 0, _, 0, _, 0, _, 7, _, 5, _],
    [36, 31, 28, 31, 36, 31, 28, 31, 36, 35, 31, 28, 24, 28, 31, 35],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [0, 6, 8, 14],
  ),
  pattern(
    [-2, _, -2, _, 10, _, -2, _, -5, _, -5, _, 2, _, 0, _],
    [29, 33, 36, 41, 36, 33, 29, 33, 26, 29, 33, 36, 33, 29, 26, 24],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [0, 4, 8, 12],
  ),
];

const TRACKS: Record<MusicTrack, { bars: Step[][]; bpm: number; leadGain: number }> = {
  menu: { bars: MENU_BARS, bpm: 92, leadGain: 0.055 },
  game: { bars: GAME_BARS, bpm: 138, leadGain: 0.07 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

let enabled = true;
let current: MusicTrack | null = null;
let intensity = 1;
let timer: number | null = null;
let nextNoteTime = 0;
let step = 0;
let bar = 0;
let unlockInstalled = false;
/** Prevent a generic pointer gesture from waking music while gameplay is paused. */
let explicitlySuspended = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.connect(ctx.destination);
    }
    return ctx;
  } catch {
    return null;
  }
}

function getNoise(audio: AudioContext): AudioBuffer | null {
  try {
    if (!noiseBuffer) {
      const len = Math.floor(audio.sampleRate * 0.2);
      noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  } catch {
    return null;
  }
}

function fadeTo(value: number, seconds: number) {
  if (!ctx || !master) return;
  try {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.linearRampToValueAtTime(Math.max(0.0001, value), t + seconds);
  } catch {
    /* ignore */
  }
}

function tone(
  audio: AudioContext,
  freq: number,
  time: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
) {
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(master ?? audio.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
    osc.start(time);
    osc.stop(time + duration + 0.02);
  } catch {
    /* ignore */
  }
}

function percussion(audio: AudioContext, time: number, gainValue: number) {
  const buffer = getNoise(audio);
  if (!buffer) return;
  try {
    const src = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    src.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6000, time);
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master ?? audio.destination);
    src.onended = () => {
      try {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
    src.start(time);
    src.stop(time + 0.06);
  } catch {
    /* ignore */
  }
}

function stepDuration(track: MusicTrack): number {
  const bpm = TRACKS[track].bpm * (track === "game" ? intensity : 1);
  return 60 / bpm / 4; // sixteenth notes
}

function scheduleStep(audio: AudioContext, track: MusicTrack, time: number) {
  const config = TRACKS[track];
  const bars = config.bars;
  const cell = bars[bar % bars.length]?.[step];
  if (!cell) return;
  const gap = stepDuration(track);

  if (cell.bass !== null) {
    tone(audio, note(cell.bass), time, gap * 1.8, "square", 0.09);
  }
  if (cell.lead !== null) {
    tone(audio, note(cell.lead), time, gap * 0.85, "triangle", config.leadGain);
  }
  if (cell.kick) {
    tone(audio, 62, time, 0.11, "sine", 0.12);
  }
  if (cell.hat) {
    percussion(audio, time, track === "game" ? 0.035 : 0.022);
  }
}

function tick() {
  const audio = ctx;
  const track = current;
  if (!audio || !track) return;
  try {
    while (nextNoteTime < audio.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(audio, track, nextNoteTime);
      nextNoteTime += stepDuration(track);
      step += 1;
      if (step >= 16) {
        step = 0;
        bar += 1;
      }
    }
  } catch {
    /* ignore */
  }
}

function startLoop() {
  if (timer !== null || typeof window === "undefined") return;
  timer = window.setInterval(tick, LOOKAHEAD_MS);
}

function stopLoop() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

/** One-shot gesture unlock: iOS refuses to start audio without user input. */
export function installMusicUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const handler = () => {
    if (!enabled || explicitlySuspended) return;
    const audio = getCtx();
    if (audio && current) {
      if (audio.state === "suspended") void audio.resume().catch(() => {});
      fadeTo(MASTER_GAIN, 0.6);
    }
  };
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler, { passive: true });
}

export function setMusicEnabled(value: boolean) {
  enabled = value;
  if (!value) {
    explicitlySuspended = true;
    fadeTo(0.0001, 0.25);
    stopLoop();
    if (ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
    return;
  }
  explicitlySuspended = false;
  if (current) playTrack(current, true);
}

/** Scales gameplay tempo with difficulty tier (1 = base). */
export function setMusicIntensity(level: number) {
  const clamped = Math.max(1, Math.min(1.28, 1 + (level - 1) * 0.05));
  intensity = clamped;
}

export function playTrack(track: MusicTrack, force = false) {
  if (!enabled) {
    current = track;
    return;
  }
  if (current === track && timer !== null && !force) return;
  const audio = getCtx();
  current = track;
  if (!audio) return;
  explicitlySuspended = false;
  if (audio.state === "suspended") void audio.resume().catch(() => {});
  step = 0;
  bar = 0;
  nextNoteTime = audio.currentTime + 0.06;
  startLoop();
  fadeTo(MASTER_GAIN, 0.5);
}

export function stopMusic() {
  explicitlySuspended = true;
  fadeTo(0.0001, 0.35);
  current = null;
  window.setTimeout(stopLoop, 400);
}

export function suspendMusic() {
  explicitlySuspended = true;
  fadeTo(0.0001, 0.2);
  stopLoop();
  if (ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
}

export function resumeMusic() {
  if (!enabled || !current) return;
  const audio = getCtx();
  if (!audio) return;
  explicitlySuspended = false;
  if (audio.state === "suspended") void audio.resume().catch(() => {});
  nextNoteTime = audio.currentTime + 0.06;
  startLoop();
  fadeTo(MASTER_GAIN, 0.4);
}
