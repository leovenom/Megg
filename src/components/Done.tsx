"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { clearDoneNotification, clearMediaPosition, setMediaHandlers, setMediaInfo, stopKeepAlive } from "@/lib/background";
import { startAlarm } from "@/lib/sound";
import { Egg, HalfEgg } from "./Egg";
import type { DonenessId } from "@/lib/eggs";
import { rich, useT } from "@/lib/i18n";

const SPARKLES = [
  { x: -110, y: -60, s: 14, d: 0 },
  { x: 105, y: -90, s: 10, d: 0.4 },
  { x: -80, y: 70, s: 9, d: 0.8 },
  { x: 120, y: 40, s: 13, d: 0.2 },
  { x: 0, y: -140, s: 8, d: 0.6 },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const rise = (i: number) => ({
  initial: { opacity: 0, transform: "translateY(8px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.3, ease: EASE_OUT, delay: 0.15 + i * 0.06 },
});

export function Done({
  doneness,
  label,
  onReset,
}: {
  doneness: DonenessId;
  label: string;
  onReset: () => void;
}) {
  const t = useT();
  const resetRef = useRef(onReset);
  useEffect(() => {
    resetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    const stop = startAlarm();
    clearMediaPosition();
    // The lock screen pause button doubles as "stop alarm".
    const unwire = setMediaHandlers({ pause: () => resetRef.current() });
    return () => {
      stop();
      unwire();
      stopKeepAlive();
      void clearDoneNotification();
    };
  }, []);

  useEffect(() => {
    setMediaInfo(t.doneTitle, label);
  }, [t.doneTitle, label]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16 text-center">
      <div className="relative grid h-[320px] w-full place-items-center">
        <div className="anim-halo absolute size-64 rounded-full bg-accent/25" />
        {SPARKLES.map((p, i) => (
          <span key={i} className="absolute" style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
            <svg
              viewBox="0 0 20 20"
              width={p.s}
              height={p.s}
              className="anim-twinkle block text-accent"
              aria-hidden
              style={{ animationDelay: `${p.d}s` }}
            >
              <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor" />
            </svg>
          </span>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
        >
          <div className="anim-hop origin-bottom drop-shadow-[0_22px_20px_rgba(90,60,30,0.2)]">
            <Egg size={140} face />
          </div>
        </motion.div>
      </div>

      <motion.h2 {...rise(0)} className="font-display text-5xl tracking-tight">
        {t.doneTitle}
      </motion.h2>
      <motion.div {...rise(1)} className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
        <HalfEgg doneness={doneness} size={18} />
        {label}
      </motion.div>
      <motion.p
        {...rise(2)}
        className="mt-6 max-w-xs rounded-card bg-card/70 px-5 py-4 text-left text-sm leading-relaxed text-fg/70 shadow-soft"
      >
        {rich(t.iceBath)}
        {doneness === "liquida" || doneness === "cremosa" ? t.iceBathSoft : t.iceBathHard} {t.peel}
      </motion.p>

      <button
        onClick={onReset}
        className="press mt-auto w-full rounded-full bg-inverse py-4 text-base font-medium text-on-inverse shadow-lift"
      >
        {t.stopAlarm}
      </button>
    </div>
  );
}
