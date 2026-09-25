"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { startAlarm } from "@/lib/sound";
import { Egg, HalfEgg } from "./Egg";
import type { DonenessId } from "@/lib/eggs";

const SPARKLES = [
  { x: -110, y: -60, s: 14, d: 0 },
  { x: 105, y: -90, s: 10, d: 0.4 },
  { x: -80, y: 70, s: 9, d: 0.8 },
  { x: 120, y: 40, s: 13, d: 0.2 },
  { x: 0, y: -140, s: 8, d: 0.6 },
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
  useEffect(() => startAlarm(), []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16 text-center">
      <div className="relative grid h-[320px] w-full place-items-center">
        <motion.div
          className="absolute size-64 rounded-full bg-yolk/25"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.25, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {SPARKLES.map((p, i) => (
          <motion.svg
            key={i}
            viewBox="0 0 20 20"
            width={p.s}
            height={p.s}
            className="absolute text-yolk"
            style={{ x: p.x, y: p.y }}
            animate={{ scale: [0, 1, 0], rotate: [0, 90] }}
            transition={{ duration: 1.4, delay: p.d, repeat: Infinity }}
          >
            <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor" />
          </motion.svg>
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        >
          <motion.div
            animate={{ y: [0, -28, 0], scaleY: [1, 1.04, 0.92, 1], scaleX: [1, 0.97, 1.06, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", times: [0, 0.45, 0.9, 1] }}
            className="drop-shadow-[0_22px_20px_rgba(90,60,30,0.2)]"
          >
            <Egg size={140} face />
          </motion.div>
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-5xl tracking-tight"
      >
        Tá no ponto!
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-3 flex items-center gap-2 text-sm text-ink/55"
      >
        <HalfEgg doneness={doneness} size={18} />
        {label}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-xs rounded-3xl bg-white/70 px-5 py-4 text-sm leading-relaxed text-ink/70 shadow-soft"
      >
        Tire da água e leve direto a um <b>banho de gelo</b> por 1–2 minutos para parar o cozimento.
      </motion.p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onReset}
        className="mt-auto w-full rounded-full bg-ink py-4 text-base font-medium text-cream shadow-lift"
      >
        Desligar alarme
      </motion.button>
    </div>
  );
}
