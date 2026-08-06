import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EMPTY_RUN_STATS,
  type ActiveTarget,
  type FloatingFeedback,
  type GameOverReason,
  type GamePhase,
  type GameSettings,
  type RunStats,
  type TargetColor,
} from "./types";
import {
  DIFFICULTY_LEVELS,
  levelForScore,
  pickColor,
  spawnDelayFor,
  presetFor,
  type Difficulty,
  type DifficultyLevel,
} from "./difficulty";
import { playSound, resumeAudio, setSoundEnabled, suspendAudio, unlockAudio } from "./audio";
import { setVibrationEnabled, vibrate } from "./haptics";
import { gradeReaction, multiplierForCombo, resolveScore } from "./scoring";
import { pickPlacement, targetSizeFor, type AreaBounds } from "./positioning";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "./storage";
import { MODE_CONFIG, type GameMode } from "./modes";
import type { GameSessionResult } from "./progressionTypes";
import { onAppBackground } from "@/lib/appLifecycle";
import { isIOS, isNativePlatform } from "@/lib/nativePlatform";
import { GAME_FEATURES } from "@/config/gameFeatures";
import { classifyTap, closeCallMessage, isCloseCall, TIMING_LABEL, type TapTiming } from "./tapTiming";
import { milestoneFor } from "./comboMilestones";
import { EMPTY_RUN_RECORD, recordRun, type RunRecord } from "./playerStats";

export { difficultyProgress } from "./difficulty";

const EXIT_MS = 260;
/** forgiving window for the second purple tap, measured from the first tap */
const PURPLE_SECOND_WINDOW = 1000;
/** protected pause after losing a life in Survival */
const LIFE_LOST_MS = 900;

interface Burst {
  id: number;
  x: number;
  y: number;
}

function newSessionId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface UseGameOptions {
  mode: GameMode;
  difficulty?: Difficulty;
  onComplete: (result: GameSessionResult) => void;
}

export function useGame({ mode, difficulty = "standard", onComplete }: UseGameOptions) {
  const [phase, setPhase] = useState<GamePhase>("start");
  /** Why the run is paused — drives the pause overlay copy. */
  const [pauseSource, setPauseSource] = useState<"manual" | "system">("manual");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [target, setTarget] = useState<ActiveTarget | null>(null);
  const [feedback, setFeedback] = useState<FloatingFeedback[]>([]);
  const [reason, setReason] = useState<GameOverReason | null>(null);
  const [runStats, setRunStats] = useState<RunStats>(EMPTY_RUN_STATS);
  const [scorePulse, setScorePulse] = useState(0);
  const [comboFlash, setComboFlash] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<DifficultyLevel | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lives, setLives] = useState<number | null>(null);
  const [lifeLost, setLifeLost] = useState(false);
  const [lastResult, setLastResult] = useState<GameSessionResult | null>(null);
  /** Phase 1 feel: milestone banner, timing badge and screen pulse. */
  const [milestone, setMilestone] = useState<{ id: number; label: string } | null>(null);
  const [pulse, setPulse] = useState(0);
  const [lastTap, setLastTap] = useState<{
    timing: TapTiming;
    reaction: number;
    closeCall: boolean;
  } | null>(null);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const [greatFlash, setGreatFlash] = useState(false);

  // ---- refs: always-current gameplay values (no stale closures) ----
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const configRef = useRef(MODE_CONFIG[mode]);
  configRef.current = MODE_CONFIG[mode];
  const presetRef = useRef(presetFor(difficulty));
  presetRef.current = presetFor(difficulty);
  /** spawn gap for the current score, scaled by the chosen difficulty */
  const nextSpawnDelay = () =>
    spawnDelayFor(levelForScore(scoreRef.current), presetRef.current.spawnScale);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const phaseRef = useRef<GamePhase>("start");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const bestMultiplierRef = useRef(1);
  const livesRef = useRef<number>(1);
  const targetRef = useRef<ActiveTarget | null>(null);
  const endedRef = useRef(false);
  const runIdRef = useRef(0);
  const idRef = useRef(0);
  const sessionIdRef = useRef("");
  const startedAtRef = useRef(0);
  const levelRef = useRef(1);
  const historyRef = useRef<TargetColor[]>([]);
  const reactionsRef = useRef<number[]>([]);
  const runStatsRef = useRef<RunStats>({ ...EMPTY_RUN_STATS });
  /** Phase 1 counters for the local statistics profile */
  const runRecordRef = useRef<RunRecord>({ ...EMPTY_RUN_RECORD });
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const boundsRef = useRef<AreaBounds>({ width: 320, height: 480 });
  const settingsRef = useRef(settings);

  // timers
  const spawnTimer = useRef<number | null>(null);
  const expireTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const lifeTimer = useRef<number | null>(null);
  const clockTimer = useRef<number | null>(null);
  const decorTimers = useRef<number[]>([]);
  const expireAt = useRef(0);
  const spawnAt = useRef(0);
  const remainingTarget = useRef(0);
  const remainingSpawn = useRef(0);
  // blitz clock
  const clockRemaining = useRef(0);
  const clockStartedAt = useRef(0);
  const lastBeepSecond = useRef(-1);

  settingsRef.current = settings;

  const reducedMotion = settings.reducedMotion || systemReducedMotion;

  useEffect(() => {
    console.info("[loss-debug] phase committed", {
      phase,
      score,
      lives,
      currentRound: runStats.successes,
      animationFlags: { shake, flash, lifeLost },
      lastResultExists: lastResult !== null,
    });
  }, [phase, score, lives, runStats.successes, shake, flash, lifeLost, lastResult]);

  // ---------- persistence ----------
  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    setSoundEnabled(stored.sound);
    setVibrationEnabled(stored.vibration);
    setHydrated(true);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const updateSettings = useCallback((next: Partial<GameSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      settingsRef.current = merged;
      setSoundEnabled(merged.sound);
      setVibrationEnabled(merged.vibration);
      saveSettings(merged);
      return merged;
    });
  }, []);

  // ---------- play-area measurement ----------
  const observerRef = useRef<ResizeObserver | null>(null);
  const registerArea = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        boundsRef.current = { width: rect.width, height: rect.height };
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  // ---------- timers ----------
  const stopClock = useCallback(() => {
    if (clockTimer.current !== null) window.clearInterval(clockTimer.current);
    clockTimer.current = null;
  }, []);

  const clearAllTimers = useCallback(() => {
    if (spawnTimer.current !== null) window.clearTimeout(spawnTimer.current);
    if (expireTimer.current !== null) window.clearTimeout(expireTimer.current);
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    if (lifeTimer.current !== null) window.clearTimeout(lifeTimer.current);
    spawnTimer.current = null;
    expireTimer.current = null;
    exitTimer.current = null;
    lifeTimer.current = null;
    stopClock();
  }, [stopClock]);

  const clearDecorTimers = useCallback(() => {
    decorTimers.current.forEach((t) => window.clearTimeout(t));
    decorTimers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      decorTimers.current = decorTimers.current.filter((t) => t !== id);
      fn();
    }, ms);
    decorTimers.current.push(id);
  }, []);

  const setActiveTarget = useCallback((next: ActiveTarget | null) => {
    targetRef.current = next;
    setTarget(next);
  }, []);

  const pushFeedback = useCallback(
    (text: string, sub: string | undefined, x: number, y: number, tone: TargetColor) => {
      const id = ++idRef.current;
      setFeedback((prev) => [...prev.slice(-4), { id, text, sub, x, y, tone }]);
      later(() => setFeedback((prev) => prev.filter((f) => f.id !== id)), 800);
    },
    [later],
  );

  // ---------- game over ----------
  const endGame = useCallback(
    (why: GameOverReason | null) => {
      if (endedRef.current) {
        console.info("[loss-debug] endGame conditional return: already ended", {
          phase: phaseRef.current,
          score: scoreRef.current,
          lives: livesRef.current,
        });
        return;
      }
      const nativeIOS = isNativePlatform() && isIOS();
      console.info("[loss-debug] transition playing -> losing", {
        why,
        phase: phaseRef.current,
        score: scoreRef.current,
        lives: livesRef.current,
        currentRound: runStatsRef.current.successes,
        nativeIOS,
      });
      endedRef.current = true;
      runIdRef.current += 1; // invalidate any in-flight callback
      console.info("[loss-debug] before clearAllTimers");
      clearAllTimers();
      clearDecorTimers();
      console.info("[loss-debug] after clearAllTimers/clearDecorTimers");
      console.info("[loss-debug] before setActiveTarget(null)");
      setActiveTarget(null);
      console.info("[loss-debug] after setActiveTarget(null)");
      lastPositionRef.current = null;

      const reactions = reactionsRef.current;
      const avg = reactions.length
        ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
        : null;
      const fastest = reactions.length ? Math.round(Math.min(...reactions)) : null;
      const stats: RunStats = {
        ...runStatsRef.current,
        avgReaction: avg,
        fastestReaction: fastest,
      };
      runStatsRef.current = stats;
      console.info("[loss-debug] before losing state setters", { stats, why });
      setRunStats(stats);
      setReason(why);

      if (!nativeIOS && !reducedMotion && why !== null) {
        setShake(true);
        setFlash(true);
        later(() => setShake(false), 500);
        later(() => setFlash(false), 320);
      } else {
        setShake(false);
        setFlash(false);
        setLifeLost(false);
      }

      const result: GameSessionResult = {
        sessionId: sessionIdRef.current || newSessionId(),
        mode: modeRef.current,
        score: scoreRef.current,
        bestCombo: bestComboRef.current,
        bestMultiplier: bestMultiplierRef.current,
        stats,
        reason: why,
        durationMs: Math.max(0, Math.round(performance.now() - startedAtRef.current)),
        livesRemaining: Number.isFinite(livesRef.current) ? livesRef.current : null,
        completed: why !== "quit",
      };
      console.info("[loss-debug] before setLastResult", result);
      setLastResult(result);
      console.info("[loss-debug] after setLastResult; before setPhase(over)");
      phaseRef.current = "over";
      setPhase("over");
      console.info("[loss-debug] after setPhase(over); transition losing -> over");

      if (!nativeIOS) {
        playSound(why === null ? "levelup" : "gameover");
        vibrate("gameover");
      }

      if (why !== "quit") {
        console.info("[loss-debug] before onComplete", { sessionId: result.sessionId });
        try {
          onCompleteRef.current(result);
          console.info("[loss-debug] after onComplete");
        } catch (error) {
          console.error("[loss-debug] onComplete threw", error);
        }
      } else {
        console.info("[loss-debug] onComplete conditional return: quit result");
      }
    },
    [clearAllTimers, clearDecorTimers, later, reducedMotion, setActiveTarget],
  );

  const endGameRef = useRef(endGame);
  endGameRef.current = endGame;

  // ---------- blitz clock ----------
  const tickClock = useCallback(() => {
    if (endedRef.current || phaseRef.current !== "playing") return;
    const elapsed = performance.now() - clockStartedAt.current;
    const remaining = Math.max(0, clockRemaining.current - elapsed);
    setTimeLeft(remaining);
    const secs = Math.ceil(remaining / 1000);
    if (secs <= 3 && secs > 0 && secs !== lastBeepSecond.current) {
      lastBeepSecond.current = secs;
      playSound("countdown");
    }
    if (remaining <= 0) {
      clockRemaining.current = 0;
      stopClock();
      endGameRef.current(null);
    }
  }, [stopClock]);

  const startClock = useCallback(() => {
    stopClock();
    if (configRef.current.timeLimitMs === null) return;
    clockStartedAt.current = performance.now();
    clockTimer.current = window.setInterval(tickClock, 100);
  }, [stopClock, tickClock]);

  const applyTimePenalty = useCallback(
    (ms: number) => {
      if (configRef.current.timeLimitMs === null) return;
      const elapsed = performance.now() - clockStartedAt.current;
      const remaining = Math.max(0, clockRemaining.current - elapsed - ms);
      clockRemaining.current = remaining;
      clockStartedAt.current = performance.now();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        stopClock();
        endGameRef.current(null);
      }
    },
    [stopClock],
  );

  // ---------- spawning ----------
  const spawnRef = useRef<() => void>(() => {});

  const scheduleSpawn = useCallback((delay: number) => {
    if (endedRef.current) return;
    if (spawnTimer.current !== null) window.clearTimeout(spawnTimer.current);
    const runId = runIdRef.current;
    spawnAt.current = performance.now() + delay;
    remainingSpawn.current = delay;
    spawnTimer.current = window.setTimeout(() => {
      spawnTimer.current = null;
      if (runId !== runIdRef.current || endedRef.current) return;
      if (phaseRef.current !== "playing") return;
      spawnRef.current();
    }, delay);
  }, []);

  /** A mistake: ends the run, costs a life, or burns clock depending on mode. */
  const registerMistake = useCallback(
    (why: GameOverReason) => {
      if (endedRef.current || phaseRef.current !== "playing") {
        console.info("[loss-debug] registerMistake conditional return", {
          why,
          ended: endedRef.current,
          phase: phaseRef.current,
        });
        return;
      }
      const config = configRef.current;

      console.info("[loss-debug] registerMistake entered", {
        why,
        phase: phaseRef.current,
        score: scoreRef.current,
        lives: livesRef.current,
        currentRound: runStatsRef.current.successes,
      });

      comboRef.current = 0;
      runRecordRef.current.mistakes += 1;
      setMilestone(null);
      console.info("[loss-debug] before setCombo(0)");
      setCombo(0);
      console.info("[loss-debug] after setCombo(0)");

      if (config.penalties) {
        const penalty =
          why === "tapped-trap"
            ? config.penalties.trap
            : why === "incomplete-purple"
              ? config.penalties.purple
              : why === "extra-tap"
                ? config.penalties.extra
                : config.penalties.missed;
        playSound("gameover");
        vibrate("gameover");
        if (!reducedMotion) {
          setFlash(true);
          later(() => setFlash(false), 260);
        }
        const t = targetRef.current;
        if (t) pushFeedback(`−${Math.round(penalty / 1000)}s`, undefined, t.x, t.y, "red");
        applyTimePenalty(penalty);
        if (endedRef.current) return;

        if (expireTimer.current !== null) {
          window.clearTimeout(expireTimer.current);
          expireTimer.current = null;
        }
        setActiveTarget(null);
        scheduleSpawn(nextSpawnDelay());
        return;
      }

      if (livesRef.current > 1) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        playSound("gameover");
        vibrate("gameover");
        if (!reducedMotion) {
          setShake(true);
          setFlash(true);
          later(() => setShake(false), 400);
          later(() => setFlash(false), 260);
        }
        if (expireTimer.current !== null) {
          window.clearTimeout(expireTimer.current);
          expireTimer.current = null;
        }
        if (spawnTimer.current !== null) {
          window.clearTimeout(spawnTimer.current);
          spawnTimer.current = null;
        }
        setActiveTarget(null);
        setLifeLost(true);
        const runId = runIdRef.current;
        lifeTimer.current = window.setTimeout(() => {
          lifeTimer.current = null;
          if (runId !== runIdRef.current || endedRef.current) return;
          setLifeLost(false);
          if (phaseRef.current === "playing") {
            scheduleSpawn(nextSpawnDelay());
          }
        }, LIFE_LOST_MS);
        return;
      }

      livesRef.current = 0;
      console.info("[loss-debug] before final-life setLives", {
        phase: phaseRef.current,
        lives: livesRef.current,
      });
      setLives(configRef.current.lives > 1 ? 0 : null);
      console.info("[loss-debug] after setLives; before endGame");
      endGameRef.current(why);
      console.info("[loss-debug] after endGame");
    },
    [applyTimePenalty, later, pushFeedback, reducedMotion, scheduleSpawn, setActiveTarget],
  );

  const registerMistakeRef = useRef(registerMistake);
  registerMistakeRef.current = registerMistake;

  const handleExpire = useCallback((targetId: number) => {
    const current = targetRef.current;
    if (!current || current.id !== targetId || current.resolved) return;
    if (phaseRef.current !== "playing" || endedRef.current) return;

    if (current.color === "red") {
      // resolving a red target by letting it expire is a success
      resolveSuccessRef.current(current, 1, null, "TRAP AVOIDED");
      return;
    }
    if (current.color === "purple" && current.taps === 1) {
      registerMistakeRef.current("incomplete-purple");
      return;
    }
    registerMistakeRef.current("missed-target");
  }, []);

  const spawn = useCallback(() => {
    if (endedRef.current || phaseRef.current !== "playing") return;
    const config = configRef.current;
    const level = levelForScore(scoreRef.current);
    if (level.level !== levelRef.current) {
      levelRef.current = level.level;
      setLevelUp(level);
      playSound("levelup");
      later(() => setLevelUp(null), 1100);
    }

    const color = pickColor(historyRef.current, config.colors);
    historyRef.current = [color, ...historyRef.current].slice(0, 3);

    const bounds = boundsRef.current;
    const size = targetSizeFor(bounds, level.targetSize);
    const placement = pickPlacement(bounds, size, lastPositionRef.current);
    lastPositionRef.current = { x: placement.x, y: placement.y };

    const duration = Math.max(
      360,
      Math.round(level.targetDuration * config.durationScale * presetRef.current.durationScale),
    );

    const next: ActiveTarget = {
      id: ++idRef.current,
      color,
      x: placement.x,
      y: placement.y,
      size: placement.size,
      duration,
      spawnedAt: performance.now(),
      taps: 0,
      state: "active",
      resolved: false,
    };
    setActiveTarget(next);

    expireAt.current = performance.now() + next.duration;
    if (expireTimer.current !== null) window.clearTimeout(expireTimer.current);
    const runId = runIdRef.current;
    expireTimer.current = window.setTimeout(() => {
      expireTimer.current = null;
      if (runId !== runIdRef.current) return;
      handleExpire(next.id);
    }, next.duration);
  }, [handleExpire, later, setActiveTarget]);

  spawnRef.current = spawn;

  // ---------- success ----------
  const resolveSuccess = useCallback(
    (t: ActiveTarget, base: number, reaction: number | null, label: string) => {
      if (t.resolved || endedRef.current) return;
      const current = targetRef.current;
      if (!current || current.id !== t.id || current.resolved) return;

      // mark resolved immediately so extra pointer events are ignored
      const resolvedTarget: ActiveTarget = {
        ...current,
        resolved: true,
        state: "resolving",
      };
      targetRef.current = resolvedTarget;
      setTarget(resolvedTarget);
      if (expireTimer.current !== null) {
        window.clearTimeout(expireTimer.current);
        expireTimer.current = null;
      }

      const nativeIOS = isNativePlatform() && isIOS();
      const result = resolveScore(base, comboRef.current);
      comboRef.current = GAME_FEATURES.comboSystem ? result.combo : 0;
      setCombo(comboRef.current);
      bestComboRef.current = Math.max(bestComboRef.current, result.combo);
      bestMultiplierRef.current = Math.max(bestMultiplierRef.current, result.multiplier);
      setBestCombo(bestComboRef.current);
      scoreRef.current += result.total;
      setScore(scoreRef.current);
      setScorePulse((p) => p + 1);

      // ---- timing classification (Phase 1) ----
      const window_ = Math.max(1, t.duration);
      const hasReaction = reaction !== null && Number.isFinite(reaction);
      const timing: TapTiming = hasReaction ? classifyTap(reaction as number, window_) : "good";
      const closeCall =
        GAME_FEATURES.closeCallSystem && hasReaction
          ? isCloseCall(reaction as number, window_)
          : false;

      const stats = runStatsRef.current;
      const record = runRecordRef.current;
      stats.successes += 1;
      record.taps += 1;
      if (t.color === "gold") stats.gold += 1;
      if (t.color === "red") stats.trapsAvoided += 1;
      if (t.color === "purple") stats.purpleCompletions += 1;
      if (hasReaction) {
        const ms = reaction as number;
        reactionsRef.current.push(ms);
        record.reactionSamples += 1;
        record.totalReactionTime += ms;
        record.fastestReaction =
          record.fastestReaction === null ? ms : Math.min(record.fastestReaction, ms);
        const grade = gradeReaction(ms);
        if (grade === "PERFECT") stats.perfect += 1;
        else if (grade === "FAST") stats.fast += 1;
        else stats.good += 1;
        if (GAME_FEATURES.perfectTapSystem) {
          if (timing === "perfect") record.perfectTaps += 1;
          else if (timing === "great") record.greatTaps += 1;
        }
        if (closeCall) record.closeCalls += 1;
        setLastTap({ timing, reaction: Math.round(ms), closeCall });
      }
      setRunStats({ ...stats });

      const timingText = closeCall
        ? closeCallMessage(reaction as number, window_)
        : GAME_FEATURES.perfectTapSystem && hasReaction && timing !== "good"
          ? TIMING_LABEL[timing]
          : label;
      const tone =
        closeCall || timing === "great" ? "green" : timing === "perfect" ? "gold" : t.color;
      pushFeedback(timingText, `+${result.total} ×${result.multiplier}`, t.x, t.y, tone);

      // ---- game feel ----
      if (!reducedMotion && !nativeIOS) {
        if (GAME_FEATURES.perfectTapSystem && timing === "perfect" && hasReaction) {
          setPerfectFlash(true);
          later(() => setPerfectFlash(false), 220);
          setBurst({ id: t.id, x: t.x, y: t.y });
          later(() => setBurst(null), 700);
        } else if (GAME_FEATURES.perfectTapSystem && timing === "great" && hasReaction) {
          setGreatFlash(true);
          later(() => setGreatFlash(false), 180);
        }
        if (closeCall) {
          setShake(true);
          later(() => setShake(false), 220);
        }
      }

      if (t.color === "gold") {
        if (!nativeIOS && !reducedMotion) {
          setBurst({ id: t.id, x: t.x, y: t.y });
          later(() => setBurst(null), 700);
        }
        playSound("gold");
        vibrate("gold");
      } else if (t.color === "purple") {
        playSound("purple-done");
        vibrate("purple-done");
      } else if (t.color === "red") {
        playSound("avoid");
        vibrate("success");
      } else {
        playSound("tap");
        vibrate(timing === "perfect" ? "gold" : "success");
      }

      // ---- combo milestones ----
      const reached = GAME_FEATURES.comboSystem ? milestoneFor(comboRef.current) : null;
      if (reached) {
        setMilestone({ id: ++idRef.current, label: reached.label });
        setPulse((p) => p + 1);
        later(() => setMilestone(null), 950);
        playSound("combo");
        vibrate("combo");
      }

      if (result.isMilestone) {
        setComboFlash(result.multiplier);
        later(() => setComboFlash(null), 900);
      }

      // exit animation, then schedule the next target
      const runId = runIdRef.current;
      const level = levelForScore(scoreRef.current);
      record.tier = Math.max(record.tier, level.level);
      const delay = configRef.current.instantRespawnOnScore
        ? 0
        : spawnDelayFor(level, presetRef.current.spawnScale);
      exitTimer.current = window.setTimeout(() => {
        exitTimer.current = null;
        if (runId !== runIdRef.current || endedRef.current) return;
        if (targetRef.current?.id === resolvedTarget.id) setActiveTarget(null);
      }, EXIT_MS);
      scheduleSpawn(delay);
    },
    [later, pushFeedback, reducedMotion, scheduleSpawn, setActiveTarget],
  );

  const resolveSuccessRef = useRef(resolveSuccess);
  resolveSuccessRef.current = resolveSuccess;

  // ---------- input ----------
  const tapTarget = useCallback(() => {
    if (endedRef.current || phaseRef.current !== "playing") return;
    const t = targetRef.current;
    if (!t) return;

    // a second tap on a single-tap target (green/gold) is a mistake
    if (t.resolved) {
      if (t.color === "green" || t.color === "gold") {
        registerMistakeRef.current("extra-tap");
      }
      return;
    }

    const now = performance.now();
    const elapsed = now - t.spawnedAt;

    if (t.color === "red") {
      registerMistakeRef.current("tapped-trap");
      return;
    }

    if (t.color === "purple") {
      if (t.taps === 0) {
        const updated: ActiveTarget = { ...t, taps: 1, firstTapAt: now };
        targetRef.current = updated;
        setTarget(updated);
        playSound("purple-first");
        vibrate("purple-first");
        // forgiving: give a fresh window for the second tap
        if (expireTimer.current !== null) window.clearTimeout(expireTimer.current);
        const remaining = Math.max(PURPLE_SECOND_WINDOW, t.spawnedAt + t.duration - now);
        expireAt.current = now + remaining;
        const runId = runIdRef.current;
        expireTimer.current = window.setTimeout(() => {
          expireTimer.current = null;
          if (runId !== runIdRef.current) return;
          handleExpire(updated.id);
        }, remaining);
        return;
      }
      // faster second taps are worth more
      const gap = now - (t.firstTapAt ?? t.spawnedAt);
      const base = gap < 280 ? 4 : gap < 550 ? 3 : 2;
      const label = base === 4 ? "LIGHTNING ×2" : base === 3 ? "QUICK ×2" : "DOUBLE TAP";
      resolveSuccess(t, base, elapsed, label);
      return;
    }

    if (t.color === "gold") {
      resolveSuccess(t, 3, elapsed, "BONUS");
      return;
    }

    resolveSuccess(t, 1, elapsed, gradeReaction(elapsed));
  }, [handleExpire, resolveSuccess]);

  // ---------- session control ----------
  const startGame = useCallback(() => {
    unlockAudio();
    resumeAudio();
    clearAllTimers();
    clearDecorTimers();
    const config = MODE_CONFIG[modeRef.current];
    configRef.current = config;
    runIdRef.current += 1;
    endedRef.current = false;
    sessionIdRef.current = newSessionId();
    startedAtRef.current = performance.now();
    scoreRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;
    bestMultiplierRef.current = 1;
    levelRef.current = 1;
    historyRef.current = [];
    reactionsRef.current = [];
    runStatsRef.current = { ...EMPTY_RUN_STATS };
    lastPositionRef.current = null;
    livesRef.current = config.lives;
    lastBeepSecond.current = -1;
    setLives(Number.isFinite(config.lives) ? config.lives : null);
    setLifeLost(false);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setRunStats(EMPTY_RUN_STATS);
    setReason(null);
    setLastResult(null);
    setFeedback([]);
    setBurst(null);
    setComboFlash(null);
    setLevelUp(null);
    setShake(false);
    setFlash(false);
    setActiveTarget(null);
    phaseRef.current = "playing";
    setPhase("playing");

    if (config.timeLimitMs !== null) {
      clockRemaining.current = config.timeLimitMs;
      setTimeLeft(config.timeLimitMs);
      startClock();
    } else {
      clockRemaining.current = 0;
      setTimeLeft(null);
    }

    scheduleSpawn(spawnDelayFor(DIFFICULTY_LEVELS[0], presetRef.current.spawnScale));
  }, [clearAllTimers, clearDecorTimers, scheduleSpawn, setActiveTarget, startClock]);

  const pause = useCallback((source: "manual" | "system" = "manual") => {
    if (phaseRef.current !== "playing" || endedRef.current) return;
    setPauseSource(source);
    const now = performance.now();
    const t = targetRef.current;
    remainingTarget.current =
      t && !t.resolved && expireTimer.current !== null ? Math.max(60, expireAt.current - now) : 0;
    remainingSpawn.current = spawnTimer.current !== null ? Math.max(60, spawnAt.current - now) : 0;
    if (configRef.current.timeLimitMs !== null) {
      clockRemaining.current = Math.max(0, clockRemaining.current - (now - clockStartedAt.current));
      setTimeLeft(clockRemaining.current);
    }
    clearAllTimers();
    suspendAudio();
    phaseRef.current = "paused";
    setPhase("paused");
  }, [clearAllTimers]);

  const pauseRef = useRef(pause);
  pauseRef.current = pause;

  const resume = useCallback(() => {
    if (phaseRef.current !== "paused" || endedRef.current) return;
    phaseRef.current = "playing";
    setPhase("playing");
    resumeAudio();
    if (configRef.current.timeLimitMs !== null) startClock();
    const t = targetRef.current;
    if (t && !t.resolved && remainingTarget.current > 0) {
      const rem = remainingTarget.current;
      const shifted: ActiveTarget = {
        ...t,
        spawnedAt: performance.now() - (t.duration - rem),
      };
      targetRef.current = shifted;
      setTarget(shifted);
      expireAt.current = performance.now() + rem;
      const runId = runIdRef.current;
      expireTimer.current = window.setTimeout(() => {
        expireTimer.current = null;
        if (runId !== runIdRef.current) return;
        handleExpire(shifted.id);
      }, rem);
    } else {
      setActiveTarget(null);
      scheduleSpawn(
        remainingSpawn.current > 0
          ? remainingSpawn.current
          : nextSpawnDelay(),
      );
    }
    remainingTarget.current = 0;
    remainingSpawn.current = 0;
  }, [handleExpire, scheduleSpawn, setActiveTarget, startClock]);

  const goToMenu = useCallback(() => {
    runIdRef.current += 1;
    endedRef.current = true;
    clearAllTimers();
    clearDecorTimers();
    setActiveTarget(null);
    setFeedback([]);
    setBurst(null);
    setLevelUp(null);
    setReason(null);
    setLifeLost(false);
    setTimeLeft(null);
    phaseRef.current = "start";
    setPhase("start");
  }, [clearAllTimers, clearDecorTimers, setActiveTarget]);

  /** Quit an active run — recorded as a quit, never as a completed session. */
  const quitRun = useCallback(() => {
    if (phaseRef.current === "playing" || phaseRef.current === "paused") {
      runIdRef.current += 1;
      endedRef.current = true;
      clearAllTimers();
    }
    goToMenu();
  }, [clearAllTimers, goToMenu]);

  // ---------- interruptions ----------
  // A single bus feeds browser visibility and native lifecycle events, so one
  // interruption pauses the run exactly once. Returning never auto-resumes.
  useEffect(() => {
    const off = onAppBackground(() => {
      if (phaseRef.current !== "playing") return;
      pauseRef.current("system");
    });
    return off;
  }, []);


  // lock body scroll while a run is on screen
  useEffect(() => {
    const active = phase === "playing" || phase === "paused";
    const previous = document.body.style.overflow;
    document.body.style.overflow = active ? "hidden" : previous || "";
    return () => {
      document.body.style.overflow = previous || "";
    };
  }, [phase]);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      endedRef.current = true;
      clearAllTimers();
      clearDecorTimers();
      observerRef.current?.disconnect();
    },
    [clearAllTimers, clearDecorTimers],
  );

  const multiplier = useMemo(() => multiplierForCombo(combo), [combo]);

  return {
    phase,
    difficulty: presetRef.current,
    score,
    combo,
    bestCombo,
    multiplier,
    target,
    feedback,
    reason,
    runStats,
    scorePulse,
    comboFlash,
    levelUp,
    shake,
    flash,
    burst,
    settings,
    reducedMotion,
    hydrated,
    timeLeft,
    lives,
    lifeLost,
    lastResult,
    registerArea,
    updateSettings,
    startGame,
    tapTarget,
    pause,
    pauseSource,
    resume,
    quitRun,
    goToMenu,
  };
}
