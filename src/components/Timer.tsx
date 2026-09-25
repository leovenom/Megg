"use client";

import { MotionConfig, motion, useMotionValue } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  canNotify,
  pauseKeepAlive,
  resumeKeepAlive,
  setMediaHandlers,
  setMediaInfo,
  setMediaPosition,
  stopKeepAlive,
} from "@/lib/background";
import { formatTime, type DonenessId } from "@/lib/eggs";
import { useT } from "@/lib/i18n";
import { cancelAlarm, scheduleAlarm, wakeAudio } from "@/lib/sound";
import { Egg, eggOutline } from "./Egg";

type Milestone = { id: DonenessId; seconds: number };

const BUBBLES = Array.from({ length: 16 }, (_, i) => {
  const size = 7 + ((i * 5) % 9);
  const ring = size * 2.4;
  return {
    left: 6 + ((i * 31) % 86),
    size,
    ring,
    dur: 2.2 + ((i * 7) % 6) * 0.32,
    delay: (i * 0.47) % 3.2,
    rise: 90 + ((i * 19) % 70),
  };
});

const EGG_VARIANT = 3;
const EGG_OUTLINE = eggOutline(EGG_VARIANT);
/* Resting waterline at y=24 with a 50-unit wavelength, wide enough to slide one wavelength. */
const WAVE = "M-50 24 Q-37.5 21.5 -25 24 T0 24 T25 24 T50 24 T75 24 T100 24 T125 24 T150 24 T175 24 T200 24";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Timer({
  total,
  subtitle,
  milestones,
  onCancel,
  onDone,
}: {
  total: number;
  subtitle: string;
  milestones: Milestone[];
  onCancel: () => void;
  onDone: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(total);
  const [paused, setPaused] = useState(false);
  const t = useT();
  const progress = useMotionValue(0);
  const remainingMs = useRef(total * 1000);
  const finished = useRef(false);
  const [hint, setHint] = useState(false);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (paused) return;
    const endAt = Date.now() + remainingMs.current;
    scheduleAlarm(remainingMs.current / 1000);
    let raf = 0;
    const update = () => {
      const left = Math.max(0, endAt - Date.now());
      remainingMs.current = left;
      progress.set(1 - left / (total * 1000));
      setSecondsLeft(Math.ceil(left / 1000));
      if (left === 0 && !finished.current) {
        finished.current = true;
        doneRef.current();
      }
      return left;
    };
    const tick = () => {
      if (update() > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // rAF stops while hidden; timers keep running (throttled), so this still catches the end.
    let fallback = 0;
    const check = () => {
      const left = update();
      if (left > 0) fallback = window.setTimeout(check, left + 20);
    };
    fallback = window.setTimeout(check, remainingMs.current + 20);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      wakeAudio();
      const left = update();
      // The audio clock may have been frozen in the background; realign the alarm to the wall clock.
      if (left > 0) scheduleAlarm(left / 1000);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      document.removeEventListener("visibilitychange", onVisible);
      if (!finished.current) cancelAlarm();
    };
  }, [paused, total, progress]);

  useEffect(() => {
    resumeKeepAlive();
    let alive = true;
    void canNotify().then((ok) => alive && setHint(!ok));
    const unwire = setMediaHandlers({
      play: () => {
        resumeKeepAlive();
        setPaused(false);
      },
      pause: () => {
        pauseKeepAlive();
        setPaused(true);
      },
    });
    return () => {
      alive = false;
      unwire();
      if (!finished.current) stopKeepAlive();
    };
  }, []);

  useEffect(() => {
    setMediaPosition(total, total - remainingMs.current / 1000, !paused);
  }, [paused, total]);

  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    let alive = true;
    // The browser drops the lock whenever the page is hidden, so take it again on return.
    const acquire = () => {
      if (document.visibilityState !== "visible" || (lock && !lock.released)) return;
      navigator.wakeLock
        ?.request("screen")
        .then((l) => (alive ? (lock = l) : void l.release()))
        .catch(() => {});
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, []);

  useEffect(() => {
    document.title = `${formatTime(secondsLeft)} · Megg`;
    return () => void (document.title = "Megg");
  }, [secondsLeft]);

  const elapsed = total - secondsLeft;
  const reached = milestones.filter((m) => elapsed >= m.seconds).at(-1);
  const stage = paused
    ? t.paused
    : reached
      ? t.yolk[reached.id]
      : elapsed < total * 0.3
        ? t.whiteSetting
        : t.yolkThickening;

  useEffect(() => {
    setMediaInfo(formatTime(secondsLeft), "Megg", `${stage} · ${subtitle}`);
  }, [secondsLeft, stage, subtitle]);

  const togglePause = () => {
    if (paused) resumeKeepAlive();
    else pauseKeepAlive();
    setPaused(!paused);
  };

  return (
    <div
      data-paused={paused || undefined}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6"
    >
      <div className="flex w-full justify-between">
        <button
          onClick={onCancel}
          className="press grid size-10 place-items-center rounded-full bg-sunken text-lg text-fg/60"
          aria-label={t.cancel}
        >
          ×
        </button>
        <span className="self-center text-xs text-fg-subtle">{subtitle}</span>
        <span className="size-10" />
      </div>

      <div className="relative mt-4 grid size-[min(300px,46svh)] place-items-center">
        <svg viewBox="0 0 300 300" className="absolute inset-0 -rotate-90">
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--accent-from)" }} />
              <stop offset="100%" style={{ stopColor: "var(--accent-to)" }} />
            </linearGradient>
          </defs>
          <circle cx="150" cy="150" r="128" fill="none" stroke="currentColor" strokeWidth="6" className="text-sunken" />
          <motion.circle
            cx="150"
            cy="150"
            r="128"
            fill="none"
            stroke="url(#ring)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ pathLength: progress }}
          />
        </svg>

        <MotionConfig reducedMotion="never">
          <div className="water absolute inset-[34px] overflow-hidden rounded-full">
            {BUBBLES.map((b, i) => (
              <Fragment key={i}>
                <motion.span
                  className="water-bubble absolute rounded-full"
                  style={{ left: `${b.left}%`, bottom: 0, width: b.size, height: b.size }}
                  animate={
                    paused
                      ? { transform: "translate3d(0,0,0) scale(0.7)", opacity: 0.35 }
                      : {
                          transform: [
                            "translate3d(0,0,0) scale(0.55)",
                            `translate3d(0,-${Math.round(b.rise * 0.45)}px,0) scale(0.9)`,
                            `translate3d(0,-${b.rise}px,0) scale(1.12)`,
                          ],
                          opacity: [0, 0.95, 0],
                        }
                  }
                  transition={
                    paused
                      ? { duration: 0.2 }
                      : { duration: b.dur, delay: b.delay, repeat: Infinity, ease: "linear" }
                  }
                />
                <motion.span
                  className="water-ripple absolute rounded-full"
                  style={{
                    left: `${b.left}%`,
                    bottom: b.rise - b.ring / 4,
                    marginLeft: (b.size - b.ring) / 2,
                    width: b.ring,
                    height: b.ring / 2,
                  }}
                  animate={paused ? { opacity: 0, scale: 0.4 } : { opacity: [0, 0, 0.55, 0], scale: [0.3, 0.3, 1.3, 1.5] }}
                  transition={
                    paused
                      ? { duration: 0.2 }
                      : { duration: b.dur, delay: b.delay, repeat: Infinity, ease: "linear", times: [0, 0.86, 0.92, 1] }
                  }
                />
              </Fragment>
            ))}
            <div className="water-glare absolute inset-0" />
          </div>

          <motion.div
            className="relative"
            animate={
              paused
                ? { transform: "translate3d(0,0,0) rotate(0deg)" }
                : {
                    transform: [
                      "translate3d(0,0,0) rotate(0deg)",
                      "translate3d(8px,-7px,0) rotate(2.4deg)",
                      "translate3d(2px,6px,0) rotate(0.4deg)",
                      "translate3d(-9px,-3px,0) rotate(-2.8deg)",
                      "translate3d(0,0,0) rotate(0deg)",
                    ],
                  }
            }
            transition={paused ? { duration: 0.25 } : { duration: 8.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="water-egg-shadow absolute -bottom-3 left-1/2 h-9 w-[130px] -translate-x-1/2" />
            <motion.div
              className="relative"
              animate={
                paused
                  ? { transform: "translate3d(0,0,0)" }
                  : { transform: ["translate3d(0,0,0)", "translate3d(0,-7px,0)", "translate3d(0,0,0)"] }
              }
              transition={paused ? { duration: 0.25 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Egg size={120} variant={EGG_VARIANT} className="block" />
              <svg viewBox="0 0 100 130" className="absolute inset-0 size-full" aria-hidden>
                <defs>
                  <clipPath id="egg-submerged">
                    <path
                      d={EGG_OUTLINE.d}
                      transform={EGG_OUTLINE.tilt ? `rotate(${EGG_OUTLINE.tilt} 50 80)` : undefined}
                    />
                  </clipPath>
                  <linearGradient id="egg-water" x1="0" y1="0" x2="0" y2="130" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" className="water-tint" stopOpacity="0.2" />
                    <stop offset="100%" className="water-tint" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <g clipPath="url(#egg-submerged)">
                  <motion.g
                    animate={paused ? { transform: "translate(0, -8px)" } : { transform: ["translate(0, -20px)", "translate(0, 12px)", "translate(0, -20px)"] }}
                    transition={paused ? { duration: 0.25 } : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.g
                      animate={paused ? { transform: "translate(0,0)" } : { transform: ["translate(0,0)", "translate(-50px,0)"] }}
                      transition={paused ? { duration: 0.25 } : { duration: 2.8, repeat: Infinity, ease: "linear" }}
                    >
                      <path d={`${WAVE} V200 H-50 Z`} fill="url(#egg-water)" />
                      <path d={WAVE} fill="none" strokeWidth="1" className="stroke-white/50" />
                    </motion.g>
                  </motion.g>
                </g>
              </svg>
            </motion.div>
          </motion.div>
        </MotionConfig>
      </div>

      <div className="mt-5 text-center">
        <div className="font-display text-7xl tabular-nums tracking-tight">{formatTime(secondsLeft)}</div>
        <motion.div
          key={stage}
          initial={{ opacity: 0, transform: "translateY(4px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="mt-2 text-sm text-fg-muted"
        >
          {stage}
        </motion.div>
      </div>

      <div className="mt-6 w-full px-2">
        <div className="relative h-1.5 rounded-full bg-sunken">
          <motion.div
            className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-accent-from to-accent-to"
            style={{ scaleX: progress }}
          />
          {milestones.map((m) => {
            const pos = m.seconds / total;
            const hit = elapsed >= m.seconds;
            return (
              <div key={m.id} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos * 100}%` }}>
                <div
                  className={`size-3 rounded-full border-2 border-page transition-[transform,background-color] duration-200 ease-out ${
                    hit ? "scale-100 bg-accent" : "scale-75 bg-fg/20"
                  }`}
                />
                <span
                  className={`absolute top-4 whitespace-nowrap text-micro text-fg-subtle ${
                    pos > 0.9 ? "-right-1" : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  {t.doneness[m.id].name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 pt-12">
        {hint && <p className="max-w-60 text-center text-xs text-fg-subtle">{t.keepScreenOn}</p>}
        <button
          onClick={togglePause}
          className="press rounded-full bg-card px-8 py-3.5 text-sm font-medium shadow-soft"
        >
          {paused ? t.resume : t.pause}
        </button>
      </div>
    </div>
  );
}
