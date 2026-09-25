"use client";

import { MotionConfig, motion } from "motion/react";
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
  initial: { opacity: 0, transform: "translate3d(0,8px,0)" },
  animate: { opacity: 1, transform: "translate3d(0,0,0)" },
  transition: { duration: 0.3, ease: EASE_OUT, delay: 0.15 + i * 0.06 },
});

const HOP = [
  "translate3d(0,0,0) scale(1.06, 0.92)",
  "translate3d(0,-8px,0) scale(0.97, 1.05)",
  "translate3d(0,-32px,0) scale(1, 1)",
  "translate3d(0,-3px,0) scale(0.98, 1.03)",
  "translate3d(0,0,0) scale(1.06, 0.92)",
];

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
    const unwire = setMediaHandlers({ pause: () => resetRef.current() });
    return () => {
      stop();
      unwire();
      stopKeepAlive();
      void clearDoneNotification();
    };
  }, []);

  useEffect(() => {
    setMediaInfo(t.doneTitle, "Megg", label);
  }, [t.doneTitle, label]);

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center overflow-hidden px-5 pt-16 text-center">
      <MotionConfig reducedMotion="never">
        <div className="relative grid h-[320px] w-full place-items-center">
          <motion.div
            className="absolute size-64 rounded-full bg-accent/25"
            animate={{ transform: ["scale(1)", "scale(1.16)", "scale(1)"], opacity: [0.55, 0.22, 0.55] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {SPARKLES.map((p, i) => (
            <span key={i} className="absolute text-accent" style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
              <motion.span
                className="block"
                animate={{
                  transform: ["scale(0.4) rotate(0deg)", "scale(1) rotate(45deg)", "scale(0.4) rotate(90deg)"],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 1.4, delay: p.d, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 20 20" width={p.s} height={p.s} aria-hidden>
                  <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor" />
                </svg>
              </motion.span>
            </span>
          ))}
          <motion.div
            initial={{ opacity: 0, transform: "translate3d(0,16px,0) scale(0.82)" }}
            animate={{ opacity: 1, transform: "translate3d(0,0,0) scale(1)" }}
            transition={{ type: "spring", duration: 0.55, bounce: 0.38 }}
          >
            <motion.div
              className="origin-bottom drop-shadow-[0_22px_20px_rgba(90,60,30,0.2)]"
              animate={{ transform: HOP }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.5, 0.88, 1] }}
            >
              <Egg size={140} face />
            </motion.div>
          </motion.div>
        </div>
      </MotionConfig>

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
        className="press mb-[max(1rem,env(safe-area-inset-bottom))] mt-auto w-full shrink-0 rounded-full bg-inverse py-4 text-base font-medium text-on-inverse shadow-lift"
      >
        {t.stopAlarm}
      </button>
    </div>
  );
}
