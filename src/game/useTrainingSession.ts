import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playSound } from "./audio";
import { vibrate } from "./haptics";
import { fixedTargetSize, pickPlacement, targetSizeFor, type AreaBounds } from "./positioning";
import {
  COUNTDOWN_CONFIG,
  KIDS_ASSIST_CONFIG,
  KIDS_PRAISE,
  TRAINER_MISTAKE_PAUSE,
  TRAINER_MODULES,
  TRAINER_TIMING,
  ZEN_CONFIG,
  zenDuration,
} from "./trainingConfig";
import type {
  TrainerSessionResult,
  TrainerTypeBreakdown,
  TrainingDifficulty,
  TrainingMode,
  TrainingModule,
  ZenSessionResult,
} from "./trainingTypes";
import type { ActiveTarget, FloatingFeedback, TargetColor } from "./types";

export type TrainingPhase = "countdown" | "playing" | "paused" | "summary";

const PURPLE_WINDOW = 1000;

interface Params {
  mode: TrainingMode;
  module: TrainingModule;
  difficulty: TrainingDifficulty;
  kidsAssist: boolean;
  bounds: AreaBounds | null;
  reducedMotion: boolean;
  /** skip straight to the short READY / GO countdown */
  shortCountdown: boolean;
  onZenComplete: (result: ZenSessionResult) => void;
  onTrainerComplete: (result: TrainerSessionResult) => void;
}

function emptyBreakdown(): Record<TargetColor, TrainerTypeBreakdown> {
  return {
    green: { seen: 0, correct: 0 },
    red: { seen: 0, correct: 0 },
    gold: { seen: 0, correct: 0 },
    purple: { seen: 0, correct: 0 },
  };
}

function pickColor(module: TrainingModule): TargetColor {
  const config = TRAINER_MODULES[module];
  if (!config.distribution) return config.colors[0];
  const total = config.distribution.reduce((sum, d) => sum + d.weight, 0);
  let roll = Math.random() * total;
  for (const entry of config.distribution) {
    roll -= entry.weight;
    if (roll <= 0) return entry.color;
  }
  return config.distribution[0].color;
}

function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Engine for the two non-competitive modes. It deliberately shares nothing
 * mutable with the competitive engine so training can never corrupt a run or
 * a competitive record.
 */
export function useTrainingSession(params: Params) {
  const {
    mode,
    module,
    difficulty,
    kidsAssist,
    bounds,
    reducedMotion,
    shortCountdown,
    onZenComplete,
    onTrainerComplete,
  } = params;

  const moduleConfig = TRAINER_MODULES[module];
  const timing = TRAINER_TIMING[difficulty];
  const sessionLength = moduleConfig.sessionLength;

  const [phase, setPhase] = useState<TrainingPhase>("countdown");
  const [countdownLabel, setCountdownLabel] = useState<string>(
    shortCountdown ? COUNTDOWN_CONFIG.shortSteps[0] : COUNTDOWN_CONFIG.steps[0],
  );
  const [target, setTarget] = useState<ActiveTarget | null>(null);
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);

  // counters
  const [taps, setTaps] = useState(0);
  const [streak, setStreak] = useState(0);
  const [presented, setPresented] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const targetRef = useRef<ActiveTarget | null>(null);
  const idRef = useRef(0);
  const previousPos = useRef<{ x: number; y: number } | null>(null);
  const boundsRef = useRef<AreaBounds | null>(bounds);
  const finishedRef = useRef(false);
  const sessionIdRef = useRef(newSessionId());
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  const totals = useRef({
    reactionSum: 0,
    reactionCount: 0,
    fastest: null as number | null,
    perfect: 0,
    bestStreak: 0,
    missed: 0,
    trapsAvoided: 0,
    trapTaps: 0,
    purpleCompleted: 0,
    purpleOneTap: 0,
    purpleZeroTap: 0,
    celebrations: 0,
    breakdown: emptyBreakdown(),
  });

  boundsRef.current = bounds;
  targetRef.current = target;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const pushFeedback = useCallback(
    (text: string, tone: TargetColor, x: number, y: number, sub?: string) => {
      const id = ++idRef.current;
      setFeedbacks((prev) => [...prev.slice(-3), { id, text, sub, x, y, tone }]);
      setTimeout(() => setFeedbacks((prev) => prev.filter((f) => f.id !== id)), 900);
    },
    [],
  );

  /* ---------------- session completion ---------------- */

  const finish = useCallback(
    (reason: "complete" | "quit") => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearTimers();
      setTarget(null);
      const duration = elapsedRef.current + (startedAtRef.current ? Date.now() - startedAtRef.current : 0);
      const t = totals.current;
      const avg = t.reactionCount ? Math.round(t.reactionSum / t.reactionCount) : null;
      setPhase("summary");

      if (mode === "zen") {
        onZenComplete({
          sessionId: sessionIdRef.current,
          taps,
          longestStreak: Math.max(t.bestStreak, streak),
          durationMs: duration,
          avgReaction: avg,
          fastestReaction: t.fastest,
          kidsAssist,
          celebrations: t.celebrations,
        });
        return;
      }

      const attempted = presented;
      onTrainerComplete({
        sessionId: sessionIdRef.current,
        module,
        difficulty,
        targetsPresented: attempted,
        correct,
        mistakes,
        missed: t.missed,
        accuracy: attempted > 0 ? correct / attempted : 0,
        avgReaction: avg,
        fastestReaction: t.fastest,
        perfect: t.perfect,
        bestStreak: Math.max(t.bestStreak, streak),
        durationMs: duration,
        trapsAvoided: t.trapsAvoided,
        trapTaps: t.trapTaps,
        purpleCompleted: t.purpleCompleted,
        purpleOneTap: t.purpleOneTap,
        purpleZeroTap: t.purpleZeroTap,
        breakdown: t.breakdown,
      });
      void reason;
    },
    [
      clearTimers,
      correct,
      difficulty,
      kidsAssist,
      mistakes,
      mode,
      module,
      onTrainerComplete,
      onZenComplete,
      presented,
      streak,
      taps,
    ],
  );

  /* ---------------- spawning ---------------- */

  const spawn = useCallback(() => {
    const area = boundsRef.current;
    if (!area || finishedRef.current) return;

    const color: TargetColor = mode === "zen" ? "green" : pickColor(module);
    const size =
      mode === "zen"
        ? fixedTargetSize(area, kidsAssist ? KIDS_ASSIST_CONFIG.targetPx : ZEN_CONFIG.targetPx)
        : targetSizeFor(area, timing.sizeScale);
    const placement = pickPlacement(area, size, previousPos.current, {
      centerBias: mode === "zen" && kidsAssist ? KIDS_ASSIST_CONFIG.centerBias : 0,
    });
    previousPos.current = { x: placement.x, y: placement.y };

    const duration =
      mode === "zen" ? zenDuration(taps, kidsAssist) : timing.duration;

    const next: ActiveTarget = {
      id: ++idRef.current,
      color,
      x: placement.x,
      y: placement.y,
      size,
      duration,
      spawnedAt: Date.now(),
      taps: 0,
      state: reducedMotion ? "active" : "entering",
      resolved: false,
    };
    setTarget(next);
    setPresented((n) => (mode === "trainer" ? n + 1 : n));
    if (mode === "trainer") totals.current.breakdown[color].seen += 1;

    if (!reducedMotion) {
      later(() => setTarget((cur) => (cur && cur.id === next.id ? { ...cur, state: "active" } : cur)), 90);
    }
    later(() => expire(next.id), duration);
  }, [kidsAssist, later, mode, module, reducedMotion, taps, timing.duration, timing.sizeScale]);

  const scheduleNext = useCallback(
    (extraDelay = 0) => {
      if (finishedRef.current) return;
      const delayRange =
        mode === "zen"
          ? kidsAssist
            ? KIDS_ASSIST_CONFIG.spawnDelay
            : ZEN_CONFIG.spawnDelay
          : timing.spawnDelay;
      const delay =
        delayRange.min + Math.random() * (delayRange.max - delayRange.min) + extraDelay;
      later(() => spawn(), delay);
    },
    [kidsAssist, later, mode, spawn, timing.spawnDelay],
  );

  /** A target ran out of time. */
  const expire = useCallback(
    (id: number) => {
      const current = targetRef.current;
      if (!current || current.id !== id || current.resolved || finishedRef.current) return;

      const t = totals.current;
      if (mode === "zen") {
        setStreak(0);
        setTarget(null);
        scheduleNext();
        return;
      }

      if (current.color === "red") {
        // letting a trap expire is the correct answer
        t.trapsAvoided += 1;
        t.breakdown.red.correct += 1;
        setCorrect((n) => n + 1);
        setStreak((s) => {
          const next = s + 1;
          t.bestStreak = Math.max(t.bestStreak, next);
          return next;
        });
        playSound("avoid");
        vibrate("avoid");
        pushFeedback("AVOIDED", "red", current.x, current.y, "Well held");
      } else {
        if (current.color === "purple" && current.taps === 1) t.purpleOneTap += 1;
        if (current.color === "purple" && current.taps === 0) t.purpleZeroTap += 1;
        t.missed += 1;
        setMistakes((n) => n + 1);
        setStreak(0);
        setCoachMessage(
          current.color === "purple" && current.taps === 1
            ? "Purple needs two taps — you got one."
            : `Missed — ${TRAINER_MODULES[module].rule.toLowerCase()}`,
        );
        pushFeedback("MISSED", current.color, current.x, current.y);
      }

      setTarget(null);
      const done = mode === "trainer" && presented >= sessionLength;
      if (done) finish("complete");
      else scheduleNext(mode === "trainer" ? TRAINER_MISTAKE_PAUSE / 2 : 0);
    },
    [finish, mode, module, presented, pushFeedback, scheduleNext, sessionLength],
  );

  /* ---------------- tapping ---------------- */

  const handleTap = useCallback(
    (id: number) => {
      const current = targetRef.current;
      if (!current || current.id !== id || current.resolved || phase !== "playing") return;
      const now = Date.now();
      const reaction = now - current.spawnedAt;
      const t = totals.current;

      const recordReaction = () => {
        t.reactionSum += reaction;
        t.reactionCount += 1;
        if (t.fastest === null || reaction < t.fastest) t.fastest = reaction;
        if (reaction < 250) t.perfect += 1;
      };

      /* ---- Zen: every tap is a win ---- */
      if (mode === "zen") {
        recordReaction();
        const nextTaps = taps + 1;
        setTaps(nextTaps);
        setStreak((s) => {
          const next = s + 1;
          t.bestStreak = Math.max(t.bestStreak, next);
          return next;
        });
        playSound("tap");
        vibrate("tap");
        const milestone = nextTaps % KIDS_ASSIST_CONFIG.celebrationEvery === 0;
        if (kidsAssist) {
          const praise = KIDS_PRAISE[Math.floor(Math.random() * KIDS_PRAISE.length)];
          pushFeedback(praise, "green", current.x, current.y);
          if (milestone) {
            t.celebrations += 1;
            playSound("combo");
            setCoachMessage(`${nextTaps} taps! Fantastic!`);
          }
        } else {
          pushFeedback("+1", "green", current.x, current.y);
        }
        setTarget(null);
        scheduleNext();
        return;
      }

      /* ---- Trainer ---- */
      if (current.color === "red") {
        t.trapTaps += 1;
        setMistakes((n) => n + 1);
        setStreak(0);
        playSound("gameover");
        vibrate("error");
        pushFeedback("TRAP", "red", current.x, current.y, "Don't tap red");
        setCoachMessage("That was a trap — let red targets expire.");
        setTarget(null);
        if (presented >= sessionLength) finish("complete");
        else scheduleNext(TRAINER_MISTAKE_PAUSE);
        return;
      }

      if (current.color === "purple") {
        if (current.taps === 0) {
          playSound("purple-first");
          vibrate("tap");
          setTarget({ ...current, taps: 1, firstTapAt: now });
          later(() => {
            const still = targetRef.current;
            if (still && still.id === current.id && still.taps === 1 && !still.resolved) {
              expire(still.id);
            }
          }, PURPLE_WINDOW);
          return;
        }
        recordReaction();
        t.purpleCompleted += 1;
        t.breakdown.purple.correct += 1;
        setCorrect((n) => n + 1);
        setStreak((s) => {
          const next = s + 1;
          t.bestStreak = Math.max(t.bestStreak, next);
          return next;
        });
        playSound("purple-done");
        vibrate("success");
        pushFeedback("DOUBLE", "purple", current.x, current.y);
        setTarget(null);
        if (presented >= sessionLength) finish("complete");
        else scheduleNext();
        return;
      }

      recordReaction();
      t.breakdown[current.color].correct += 1;
      setCorrect((n) => n + 1);
      setStreak((s) => {
        const next = s + 1;
        t.bestStreak = Math.max(t.bestStreak, next);
        return next;
      });
      playSound(current.color === "gold" ? "gold" : "tap");
      vibrate("tap");
      pushFeedback(current.color === "gold" ? "BONUS" : "NICE", current.color, current.x, current.y);
      setTarget(null);
      if (presented >= sessionLength) finish("complete");
      else scheduleNext();
    },
    [
      expire,
      finish,
      kidsAssist,
      later,
      mode,
      phase,
      presented,
      pushFeedback,
      scheduleNext,
      sessionLength,
      taps,
    ],
  );

  /* ---------------- countdown ---------------- */

  useEffect(() => {
    if (phase !== "countdown") return;
    const steps = shortCountdown
      ? [...COUNTDOWN_CONFIG.shortSteps]
      : [...COUNTDOWN_CONFIG.steps];
    const stepMs = shortCountdown ? COUNTDOWN_CONFIG.shortStepMs : COUNTDOWN_CONFIG.stepMs;
    const goMs = shortCountdown ? COUNTDOWN_CONFIG.shortGoMs : COUNTDOWN_CONFIG.goMs;
    let index = 0;
    setCountdownLabel(steps[0]);
    playSound("countdown");
    vibrate("tap");

    const tick = () => {
      index += 1;
      if (index < steps.length) {
        setCountdownLabel(steps[index]);
        playSound("countdown");
        vibrate("tap");
        timers.current.push(setTimeout(tick, index === steps.length - 1 ? goMs : stepMs));
        return;
      }
      startedAtRef.current = Date.now();
      setPhase("playing");
    };
    timers.current.push(setTimeout(tick, stepMs));
    return clearTimers;
  }, [clearTimers, phase, shortCountdown]);

  /** First spawn once play begins. */
  useEffect(() => {
    if (phase !== "playing" || targetRef.current || finishedRef.current) return;
    scheduleNext();
    // only re-run when the phase flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => clearTimers, [clearTimers]);

  /* ---------------- controls ---------------- */

  const pause = useCallback(() => {
    if (phase !== "playing") return;
    clearTimers();
    setTarget(null);
    pausedAtRef.current = Date.now();
    elapsedRef.current += startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    startedAtRef.current = 0;
    setPhase("paused");
  }, [clearTimers, phase]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    pausedAtRef.current = null;
    startedAtRef.current = Date.now();
    setPhase("playing");
    scheduleNext();
  }, [phase, scheduleNext]);

  const endSession = useCallback(() => finish("quit"), [finish]);

  const progress = useMemo(() => {
    if (mode === "zen") return null;
    return { current: Math.min(presented, sessionLength), total: sessionLength };
  }, [mode, presented, sessionLength]);

  return {
    phase,
    countdownLabel,
    target,
    feedbacks,
    coachMessage,
    clearCoachMessage: () => setCoachMessage(null),
    taps,
    streak,
    presented,
    correct,
    mistakes,
    accuracy: presented > 0 ? correct / presented : 0,
    progress,
    handleTap,
    pause,
    resume,
    endSession,
  };
}
