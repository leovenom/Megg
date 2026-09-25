"use client";

import { motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DONENESS, formatTime, type DonenessId } from "@/lib/eggs";
import { Egg } from "./Egg";

type Milestone = { id: DonenessId; seconds: number };

const BUBBLES = [
  { x: -118, size: 10, delay: 0, dur: 3.2 },
  { x: -84, size: 6, delay: 1.1, dur: 2.6 },
  { x: -40, size: 8, delay: 2.2, dur: 3.6 },
  { x: 36, size: 7, delay: 0.6, dur: 2.9 },
  { x: 80, size: 11, delay: 1.7, dur: 3.4 },
  { x: 116, size: 6, delay: 2.6, dur: 2.7 },
];

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
    ? "Pausado"
    : reached
      ? `Gema ${DONENESS.find((d) => d.id === reached.id)!.name.toLowerCase()}`
      : elapsed < total * 0.3
        ? "A clara está firmando…"
        : "A gema começa a engrossar…";

  return (
    <div
      data-paused={paused || undefined}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6"
    >
      <div className="flex w-full justify-between">
        <button
          onClick={onCancel}
          className="press grid size-10 place-items-center rounded-full bg-sunken text-lg text-fg/60"
          aria-label="Cancelar"
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

        <div className="absolute inset-6 overflow-hidden rounded-full bg-gradient-to-b from-well-from to-well-to">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="anim-bubble absolute bottom-0 left-1/2 rounded-full border border-line bg-card/70"
              style={{
                width: b.size,
                height: b.size,
                marginLeft: b.x,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="anim-bob relative drop-shadow-[0_18px_18px_rgba(90,60,30,0.18)]">
          <Egg size={120} variant={3} />
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
                  {DONENESS.find((d) => d.id === m.id)!.name}
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
          {paused ? "Continuar" : "Pausar"}
        </button>
      </div>
    </div>
  );
}
