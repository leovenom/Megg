"use client";

import { motion, useMotionValue } from "motion/react";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { formatTime, type DonenessId } from "@/lib/eggs";
import { useT } from "@/lib/i18n";
import { Egg, eggOutline } from "./Egg";

type Milestone = { id: DonenessId; seconds: number };

const BUBBLES = Array.from({ length: 12 }, (_, i) => {
  const size = 3 + ((i * 5) % 8);
  const ring = size * 2.2;
  return {
    left: 8 + ((i * 37) % 84),
    size,
    ring,
    dur: 2.4 + ((i * 7) % 6) * 0.35,
    delay: (i * 0.83) % 4,
    rise: 110 + ((i * 23) % 80),
    drift: ((i % 5) - 2) * 2.5,
  };
});

const EGG_VARIANT = 3;
const EGG_OUTLINE = eggOutline(EGG_VARIANT);

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
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (paused) return;
    const endAt = Date.now() + remainingMs.current;
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, endAt - Date.now());
      remainingMs.current = left;
      progress.set(1 - left / (total * 1000));
      setSecondsLeft(Math.ceil(left / 1000));
      if (left === 0) {
        doneRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, total, progress]);

  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => void lock?.release();
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

      <div className="relative mt-10 grid size-[300px] place-items-center">
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

        <div className="water absolute inset-[34px] overflow-hidden rounded-full">
          <div className="water-egg-shadow absolute left-[22%] top-[68%] h-[20%] w-[60%]" />
          {BUBBLES.map((b, i) => (
            <Fragment key={i}>
              <span
                className="water-bubble anim-bubble absolute rounded-full"
                style={
                  {
                    left: `${b.left}%`,
                    bottom: -b.size,
                    width: b.size,
                    height: b.size,
                    animationDuration: `${b.dur}s`,
                    animationDelay: `${b.delay}s`,
                    "--rise": `${b.rise}px`,
                    "--drift": `${b.drift}px`,
                  } as CSSProperties
                }
              />
              <span
                className="water-ripple anim-pop absolute rounded-full"
                style={{
                  left: `${b.left}%`,
                  bottom: b.rise - b.size / 2 - b.ring / 4,
                  marginLeft: (b.size - b.ring) / 2,
                  width: b.ring,
                  height: b.ring / 2,
                  animationDuration: `${b.dur}s`,
                  animationDelay: `${b.delay}s`,
                }}
              />
            </Fragment>
          ))}
          <div className="water-glare absolute inset-0" />
        </div>

        <div className="anim-float relative">
          <Egg size={120} variant={EGG_VARIANT} className="block" />
          <svg viewBox="0 0 100 130" className="absolute inset-0 size-full" aria-hidden>
            <defs>
              <clipPath id="egg-submerged">
                <path d={EGG_OUTLINE.d} transform={EGG_OUTLINE.tilt ? `rotate(${EGG_OUTLINE.tilt} 50 80)` : undefined} />
              </clipPath>
              <linearGradient id="egg-water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="water-surface" stopOpacity="0.3" />
                <stop offset="100%" className="water-deep" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <g clipPath="url(#egg-submerged)">
              <rect x="0" y="19" width="100" height="111" fill="url(#egg-water)" />
              <path
                d="M0 19 Q12 17.5 25 19 T50 19 T75 19 T100 19"
                fill="none"
                strokeWidth="1"
                className="stroke-white/50"
              />
            </g>
          </svg>
        </div>
      </div>

      <div className="mt-8 text-center">
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

      <div className="mt-8 w-full px-2">
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

      <div className="mt-auto pt-12">
        <button
          onClick={() => setPaused((p) => !p)}
          className="press rounded-full bg-card px-8 py-3.5 text-sm font-medium shadow-soft"
        >
          {paused ? t.resume : t.pause}
        </button>
      </div>
    </div>
  );
}
