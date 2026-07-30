import { useCallback, useEffect, useRef, useState } from "react";
import {
  DIFFICULTY_LEVELS,
  type ActiveTarget,
  type FloatingFeedback,
  type GameOverReason,
  type GamePhase,
  type GameSettings,
  type TargetColor,
} from "./types";
import { playSound, unlockAudio } from "./audio";

const HIGH_SCORE_KEY = "tap-or-trap:highscore";
const SETTINGS_KEY = "tap-or-trap:settings";
const PURPLE_TAP_WINDOW = 600;

const DISTRIBUTION: { color: TargetColor; weight: number }[] = [
  { color: "green", weight: 48 },
  { color: "red", weight: 32 },
  { color: "gold", weight: 10 },
  { color: "purple", weight: 10 },
];

function pickColor(history: TargetColor[]): TargetColor {
  const lastThreeSame =
    history.length >= 3 &&
    history[0] === history[1] &&
    history[1] === history[2]
      ? history[0]
      : null;
  const pool = DISTRIBUTION.filter((d) => d.color !== lastThreeSame);
  const total = pool.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const d of pool) {
    r -= d.weight;
    if (r <= 0) return d.color;
  }
  return "green";
}

export function durationForScore(score: number): number {
  let duration = DIFFICULTY_LEVELS[0].duration;
  for (const level of DIFFICULTY_LEVELS) {
    if (score >= level.minScore) duration = level.duration;
  }
  return duration;
}

export function difficultyProgress(score: number) {
  const index = DIFFICULTY_LEVELS.reduce(
    (acc, level, i) => (score >= level.minScore ? i : acc),
    0,
  );
  const current = DIFFICULTY_LEVELS[index];
  const next = DIFFICULTY_LEVELS[index + 1];
  if (!next) return { label: current.label, progress: 1, isMax: true };
  const span = next.minScore - current.minScore;
  return {
    label: current.label,
    progress: Math.min(1, (score - current.minScore) / span),
    isMax: false,
  };
}

function multiplierFor(combo: number) {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

function reactionLabel(ms: number) {
  if (ms < 250) return "PERFECT";
  if (ms <= 450) return "FAST";
  return "GOOD";
}

export function useGame() {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [target, setTarget] = useState<ActiveTarget | null>(null);
  const [feedback, setFeedback] = useState<FloatingFeedback[]>([]);
  const [reason, setReason] = useState<GameOverReason | null>(null);
  const [avgReaction, setAvgReaction] = useState<number | null>(null);
  const [scorePulse, setScorePulse] = useState(0);
  const [comboFlash, setComboFlash] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [burst, setBurst] = useState<{ id: number; x: number; y: number } | null>(
    null,
  );
  const [settings, setSettings] = useState<GameSettings>({
    sound: true,
    vibration: true,
  });

  const spawnTimer = useRef<number | null>(null);
  const expireTimer = useRef<number | null>(null);
  const expireAt = useRef<number>(0);
  const remaining = useRef<number>(0);
  const purpleTimer = useRef<number | null>(null);
  const history = useRef<TargetColor[]>([]);
  const reactions = useRef<number[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const idRef = useRef(0);
  const targetRef = useRef<ActiveTarget | null>(null);
  const settingsRef = useRef(settings);

  settingsRef.current = settings;

  useEffect(() => {
    try {
      const hs = localStorage.getItem(HIGH_SCORE_KEY);
      if (hs) setHighScore(Number(hs) || 0);
      const st = localStorage.getItem(SETTINGS_KEY);
      if (st) setSettings({ sound: true, vibration: true, ...JSON.parse(st) });
    } catch {
      /* ignore */
    }
  }, []);

  const updateSettings = useCallback((next: Partial<GameSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }, []);

  const sfx = useCallback((name: Parameters<typeof playSound>[0]) => {
    if (settingsRef.current.sound) playSound(name);
  }, []);

  const buzz = useCallback((pattern: number | number[]) => {
    if (!settingsRef.current.vibration) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (spawnTimer.current) window.clearTimeout(spawnTimer.current);
    if (expireTimer.current) window.clearTimeout(expireTimer.current);
    if (purpleTimer.current) window.clearTimeout(purpleTimer.current);
    spawnTimer.current = null;
    expireTimer.current = null;
    purpleTimer.current = null;
  }, []);

  const setActiveTarget = useCallback((t: ActiveTarget | null) => {
    targetRef.current = t;
    setTarget(t);
  }, []);

  const pushFeedback = useCallback(
    (text: string, x: number, y: number, tone: TargetColor) => {
      const id = ++idRef.current;
      setFeedback((prev) => [...prev, { id, text, x, y, tone }]);
      window.setTimeout(
        () => setFeedback((prev) => prev.filter((f) => f.id !== id)),
        800,
      );
    },
    [],
  );

  const endGame = useCallback(
    (why: GameOverReason) => {
      clearTimers();
      setActiveTarget(null);
      setReason(why);
      setPhase("over");
      setShake(true);
      setFlash(true);
      window.setTimeout(() => setShake(false), 500);
      window.setTimeout(() => setFlash(false), 320);
      sfx("gameover");
      buzz([60, 40, 120]);
      const avg = reactions.current.length
        ? Math.round(
            reactions.current.reduce((a, b) => a + b, 0) /
              reactions.current.length,
          )
        : null;
      setAvgReaction(avg);
      setHighScore((prev) => {
        const next = Math.max(prev, scoreRef.current);
        try {
          localStorage.setItem(HIGH_SCORE_KEY, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [buzz, clearTimers, setActiveTarget, sfx],
  );

  const spawn = useCallback(() => {
    const color = pickColor(history.current);
    history.current = [color, ...history.current].slice(0, 3);
    const duration = durationForScore(scoreRef.current);
    const t: ActiveTarget = {
      id: ++idRef.current,
      color,
      x: 12 + Math.random() * 76,
      y: 20 + Math.random() * 66,
      size: 0,
      duration,
      spawnedAt: performance.now(),
      taps: 0,
    };
    setActiveTarget(t);
    expireAt.current = performance.now() + duration;
    expireTimer.current = window.setTimeout(() => {
      const current = targetRef.current;
      if (!current) return;
      if (current.color === "red") {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        award(current, 1, "TRAP AVOIDED", "avoid");
      } else if (current.color === "purple" && current.taps === 1) {
        endGame("purple-single");
      } else {
        endGame("missed");
      }
    }, duration);
  }, [endGame, setActiveTarget]);

  const scheduleSpawn = useCallback(() => {
    const delay = 250 + Math.random() * 350;
    spawnTimer.current = window.setTimeout(spawn, delay);
  }, [spawn]);

  const award = useCallback(
    (
      t: ActiveTarget,
      base: number,
      text: string,
      sound: Parameters<typeof playSound>[0],
    ) => {
      clearTimers();
      setActiveTarget(null);
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      setBestCombo((prev) => Math.max(prev, nextCombo));
      const mult = multiplierFor(nextCombo);
      const gained = base * mult;
      scoreRef.current += gained;
      setScore(scoreRef.current);
      setScorePulse((p) => p + 1);
      pushFeedback(text, t.x, t.y, t.color);
      if (t.color === "gold") {
        setBurst({ id: t.id, x: t.x, y: t.y });
        window.setTimeout(() => setBurst(null), 700);
      }
      sfx(sound);
      buzz(t.color === "red" ? 15 : 25);
      if (nextCombo === 5 || nextCombo === 10 || nextCombo === 20) {
        setComboFlash(mult);
        window.setTimeout(() => setComboFlash(null), 900);
        sfx("combo");
        buzz([20, 40, 20]);
      }
      scheduleSpawn();
    },
    [buzz, clearTimers, pushFeedback, scheduleSpawn, setActiveTarget, sfx],
  );

  const tapTarget = useCallback(() => {
    const t = targetRef.current;
    if (!t) return;
    const elapsed = performance.now() - t.spawnedAt;
    if (t.color === "red") {
      endGame("trap");
      return;
    }
    if (t.color === "purple") {
      if (t.taps === 0) {
        const updated = { ...t, taps: 1 };
        setActiveTarget(updated);
        purpleTimer.current = window.setTimeout(() => {
          const cur = targetRef.current;
          if (cur && cur.id === updated.id && cur.taps === 1) {
            endGame("purple-single");
          }
        }, PURPLE_TAP_WINDOW);
        return;
      }
      reactions.current.push(elapsed);
      award(t, 2, "DOUBLE TAP", "purple");
      return;
    }
    reactions.current.push(elapsed);
    if (t.color === "gold") {
      award(t, 3, "+3", "gold");
    } else {
      award(t, 1, reactionLabel(elapsed), "tap");
    }
  }, [award, endGame, setActiveTarget]);

  const startGame = useCallback(() => {
    unlockAudio();
    clearTimers();
    scoreRef.current = 0;
    comboRef.current = 0;
    history.current = [];
    reactions.current = [];
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setAvgReaction(null);
    setReason(null);
    setFeedback([]);
    setActiveTarget(null);
    setPhase("playing");
    scheduleSpawn();
  }, [clearTimers, scheduleSpawn, setActiveTarget]);

  const pause = useCallback(() => {
    if (phase !== "playing") return;
    remaining.current = targetRef.current
      ? Math.max(80, expireAt.current - performance.now())
      : 0;
    clearTimers();
    setPhase("paused");
  }, [clearTimers, phase]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    setPhase("playing");
    const t = targetRef.current;
    if (t && remaining.current > 0) {
      const rem = remaining.current;
      const shifted = { ...t, spawnedAt: performance.now() - (t.duration - rem) };
      targetRef.current = shifted;
      setTarget(shifted);
      expireAt.current = performance.now() + rem;
      expireTimer.current = window.setTimeout(() => {
        const current = targetRef.current;
        if (!current) return;
        if (current.color === "red") award(current, 1, "TRAP AVOIDED", "avoid");
        else if (current.color === "purple" && current.taps === 1)
          endGame("purple-single");
        else endGame("missed");
      }, rem);
    } else {
      scheduleSpawn();
    }
  }, [award, endGame, phase, scheduleSpawn]);

  const quit = useCallback(() => {
    clearTimers();
    setActiveTarget(null);
    setPhase("start");
  }, [clearTimers, setActiveTarget]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    phase,
    score,
    combo,
    bestCombo,
    highScore,
    multiplier: multiplierFor(combo),
    target,
    feedback,
    reason,
    avgReaction,
    scorePulse,
    comboFlash,
    shake,
    flash,
    burst,
    settings,
    updateSettings,
    startGame,
    tapTarget,
    pause,
    resume,
    quit,
  };
}
