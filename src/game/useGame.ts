import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EMPTY_RUN_STATS,
  type ActiveTarget,
  type FloatingFeedback,
  type GameOverReason,
  type GamePhase,
  type GameSettings,
  type LifetimeStats,
  type RunStats,
  type TargetColor,
} from "./types";
import {
  DIFFICULTY_LEVELS,
  levelForScore,
  pickColor,
  spawnDelayFor,
  type DifficultyLevel,
} from "./difficulty";
import {
  playSound,
  resumeAudio,
  setSoundEnabled,
  suspendAudio,
  unlockAudio,
} from "./audio";
import { setVibrationEnabled, vibrate } from "./haptics";
import { gradeReaction, multiplierForCombo, resolveScore } from "./scoring";
import { pickPlacement, targetSizeFor, type AreaBounds } from "./positioning";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  loadHighScore,
  loadSettings,
  loadStats,
  saveHighScore,
  saveSettings,
  saveStats,
} from "./storage";

export { difficultyProgress } from "./difficulty";

const EXIT_MS = 260;
/** forgiving window for the second purple tap, measured from the first tap */
const PURPLE_SECOND_WINDOW = 1000;

interface Burst {
  id: number;
  x: number;
  y: number;
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
  const [runStats, setRunStats] = useState<RunStats>(EMPTY_RUN_STATS);
  const [lifetime, setLifetime] = useState<LifetimeStats>(DEFAULT_STATS);
  const [scorePulse, setScorePulse] = useState(0);
  const [comboFlash, setComboFlash] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<DifficultyLevel | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ---- refs: always-current gameplay values (no stale closures) ----
  const phaseRef = useRef<GamePhase>("start");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const targetRef = useRef<ActiveTarget | null>(null);
  const endedRef = useRef(false);
  const runIdRef = useRef(0);
  const idRef = useRef(0);
  const levelRef = useRef(1);
  const historyRef = useRef<TargetColor[]>([]);
  const reactionsRef = useRef<number[]>([]);
  const runStatsRef = useRef<RunStats>({ ...EMPTY_RUN_STATS });
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const boundsRef = useRef<AreaBounds>({ width: 320, height: 480 });
  const settingsRef = useRef(settings);
  const lifetimeRef = useRef(lifetime);

  // timers
  const spawnTimer = useRef<number | null>(null);
  const expireTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const decorTimers = useRef<number[]>([]);
  const expireAt = useRef(0);
  const spawnAt = useRef(0);
  const remainingTarget = useRef(0);
  const remainingSpawn = useRef(0);

  settingsRef.current = settings;
  lifetimeRef.current = lifetime;

  const reducedMotion = settings.reducedMotion || systemReducedMotion;

  // ---------- persistence ----------
  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    setSoundEnabled(stored.sound);
    setVibrationEnabled(stored.vibration);
    setHighScore(loadHighScore());
    setLifetime(loadStats());
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
  const clearAllTimers = useCallback(() => {
    if (spawnTimer.current !== null) window.clearTimeout(spawnTimer.current);
    if (expireTimer.current !== null) window.clearTimeout(expireTimer.current);
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    spawnTimer.current = null;
    expireTimer.current = null;
    exitTimer.current = null;
  }, []);

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
    (why: GameOverReason) => {
      if (endedRef.current) return; // never end twice
      endedRef.current = true;
      runIdRef.current += 1; // invalidate any in-flight callback
      clearAllTimers();
      setActiveTarget(null);
      lastPositionRef.current = null;

      const reactions = reactionsRef.current;
      const avg = reactions.length
        ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
        : null;
      const fastest = reactions.length
        ? Math.round(Math.min(...reactions))
        : null;
      const stats: RunStats = {
        ...runStatsRef.current,
        avgReaction: avg,
        fastestReaction: fastest,
      };
      runStatsRef.current = stats;
      setRunStats(stats);
      setReason(why);
      setPhase("over");
      phaseRef.current = "over";

      if (!reducedMotion) {
        setShake(true);
        setFlash(true);
        later(() => setShake(false), 500);
        later(() => setFlash(false), 320);
      }
      playSound("gameover");
      vibrate("gameover");

      const finalScore = scoreRef.current;
      const runBestCombo = Math.max(0, comboRef.current);
      setHighScore((prev) => {
        const next = Math.max(prev, finalScore);
        if (next !== prev) saveHighScore(next);
        return next;
      });

      setLifetime((prev) => {
        const merged: LifetimeStats = {
          gamesPlayed: prev.gamesPlayed + 1,
          highestScore: Math.max(prev.highestScore, finalScore),
          bestCombo: Math.max(prev.bestCombo, runBestCombo),
          fastestReaction:
            fastest === null
              ? prev.fastestReaction
              : prev.fastestReaction === null
                ? fastest
                : Math.min(prev.fastestReaction, fastest),
          totalCorrect: prev.totalCorrect + stats.successes,
          totalGold: prev.totalGold + stats.gold,
          totalTrapsAvoided: prev.totalTrapsAvoided + stats.trapsAvoided,
          totalPurpleCompletions:
            prev.totalPurpleCompletions + stats.purpleCompletions,
        };
        saveStats(merged);
        return merged;
      });
    },
    [clearAllTimers, later, reducedMotion, setActiveTarget],
  );

  const endGameRef = useRef(endGame);
  endGameRef.current = endGame;

  // ---------- spawning ----------
  const spawnRef = useRef<() => void>(() => {});

  const scheduleSpawn = useCallback(
    (delay: number) => {
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
    },
    [],
  );

  const handleExpire = useCallback(
    (targetId: number) => {
      const current = targetRef.current;
      if (!current || current.id !== targetId || current.resolved) return;
      if (phaseRef.current !== "playing" || endedRef.current) return;

      if (current.color === "red") {
        // resolving a red target by letting it expire is a success
        resolveSuccessRef.current(current, 1, null, "TRAP AVOIDED");
        return;
      }
      if (current.color === "purple" && current.taps === 1) {
        endGameRef.current("incomplete-purple");
        return;
      }
      endGameRef.current("missed-target");
    },
    [],
  );

  const spawn = useCallback(() => {
    if (endedRef.current || phaseRef.current !== "playing") return;
    const level = levelForScore(scoreRef.current);
    if (level.level !== levelRef.current) {
      levelRef.current = level.level;
      setLevelUp(level);
      playSound("levelup");
      later(() => setLevelUp(null), 1100);
    }

    const color = pickColor(historyRef.current);
    historyRef.current = [color, ...historyRef.current].slice(0, 3);

    const bounds = boundsRef.current;
    const size = targetSizeFor(bounds, level.targetSize);
    const placement = pickPlacement(bounds, size, lastPositionRef.current);
    lastPositionRef.current = { x: placement.x, y: placement.y };

    const next: ActiveTarget = {
      id: ++idRef.current,
      color,
      x: placement.x,
      y: placement.y,
      size: placement.size,
      duration: level.targetDuration,
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
    (
      t: ActiveTarget,
      base: number,
      reaction: number | null,
      label: string,
    ) => {
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

      const result = resolveScore(base, comboRef.current);
      comboRef.current = result.combo;
      setCombo(result.combo);
      setBestCombo((prev) => Math.max(prev, result.combo));
      scoreRef.current += result.total;
      setScore(scoreRef.current);
      setScorePulse((p) => p + 1);

      const stats = runStatsRef.current;
      stats.successes += 1;
      if (t.color === "gold") stats.gold += 1;
      if (t.color === "red") stats.trapsAvoided += 1;
      if (t.color === "purple") stats.purpleCompletions += 1;
      if (reaction !== null && Number.isFinite(reaction)) {
        reactionsRef.current.push(reaction);
        const grade = gradeReaction(reaction);
        if (grade === "PERFECT") stats.perfect += 1;
        else if (grade === "FAST") stats.fast += 1;
        else stats.good += 1;
      }
      setRunStats({ ...stats });

      pushFeedback(
        `+${result.total} • ${result.multiplier}X`,
        label,
        t.x,
        t.y,
        t.color,
      );

      if (t.color === "gold") {
        setBurst({ id: t.id, x: t.x, y: t.y });
        later(() => setBurst(null), 700);
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
        vibrate("success");
      }

      if (result.isMilestone) {
        setComboFlash(result.multiplier);
        later(() => setComboFlash(null), 900);
        playSound("combo");
        vibrate("combo");
      }

      // exit animation, then schedule the next target
      const runId = runIdRef.current;
      const level = levelForScore(scoreRef.current);
      const delay = spawnDelayFor(level);
      exitTimer.current = window.setTimeout(() => {
        exitTimer.current = null;
        if (runId !== runIdRef.current || endedRef.current) return;
        if (targetRef.current?.id === resolvedTarget.id) setActiveTarget(null);
      }, EXIT_MS);
      scheduleSpawn(delay);
    },
    [later, pushFeedback, scheduleSpawn, setActiveTarget],
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
        endGameRef.current("extra-tap");
      }
      return;
    }

    const now = performance.now();
    const elapsed = now - t.spawnedAt;

    if (t.color === "red") {
      endGameRef.current("tapped-trap");
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
        const remaining = Math.max(
          PURPLE_SECOND_WINDOW,
          t.spawnedAt + t.duration - now,
        );
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
      const label =
        base === 4 ? "LIGHTNING ×2" : base === 3 ? "QUICK ×2" : "DOUBLE TAP";
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
    runIdRef.current += 1;
    endedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    levelRef.current = 1;
    historyRef.current = [];
    reactionsRef.current = [];
    runStatsRef.current = { ...EMPTY_RUN_STATS };
    lastPositionRef.current = null;
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setRunStats(EMPTY_RUN_STATS);
    setReason(null);
    setFeedback([]);
    setBurst(null);
    setComboFlash(null);
    setLevelUp(null);
    setShake(false);
    setFlash(false);
    setActiveTarget(null);
    phaseRef.current = "playing";
    setPhase("playing");
    scheduleSpawn(spawnDelayFor(DIFFICULTY_LEVELS[0]));
  }, [clearAllTimers, clearDecorTimers, scheduleSpawn, setActiveTarget]);

  const pause = useCallback(() => {
    if (phaseRef.current !== "playing" || endedRef.current) return;
    const now = performance.now();
    const t = targetRef.current;
    remainingTarget.current =
      t && !t.resolved && expireTimer.current !== null
        ? Math.max(60, expireAt.current - now)
        : 0;
    remainingSpawn.current =
      spawnTimer.current !== null ? Math.max(60, spawnAt.current - now) : 0;
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
          : spawnDelayFor(levelForScore(scoreRef.current)),
      );
    }
    remainingTarget.current = 0;
    remainingSpawn.current = 0;
  }, [handleExpire, scheduleSpawn, setActiveTarget]);

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
    phaseRef.current = "start";
    setPhase("start");
  }, [clearAllTimers, clearDecorTimers, setActiveTarget]);

  /** Quit an active run — recorded as a quit, never as a failed reaction. */
  const quitRun = useCallback(() => {
    if (phaseRef.current === "playing" || phaseRef.current === "paused") {
      runIdRef.current += 1;
      endedRef.current = true;
      clearAllTimers();
    }
    goToMenu();
  }, [clearAllTimers, goToMenu]);

  // ---------- interruptions ----------
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") pauseRef.current();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", onHidden);
    window.addEventListener("pagehide", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", onHidden);
      window.removeEventListener("pagehide", onHidden);
    };
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
    score,
    combo,
    bestCombo,
    highScore,
    multiplier,
    target,
    feedback,
    reason,
    runStats,
    lifetime,
    scorePulse,
    comboFlash,
    levelUp,
    shake,
    flash,
    burst,
    settings,
    reducedMotion,
    hydrated,
    registerArea,
    updateSettings,
    startGame,
    tapTarget,
    pause,
    resume,
    quitRun,
    goToMenu,
  };
}
