"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  DONENESS,
  SIZES,
  climateLabel,
  cookSeconds,
  formatTime,
  type DonenessId,
  type SizeId,
} from "@/lib/eggs";
import { Egg, HalfEgg } from "./Egg";

export type Choice = {
  size: SizeId;
  fridge: boolean;
  roomTemp: number;
  doneness: DonenessId;
};

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

export function Setup({
  choice,
  onChange,
  onStart,
}: {
  choice: Choice;
  onChange: (c: Choice) => void;
  onStart: () => void;
}) {
  const [showScience, setShowScience] = useState(false);
  const eggTemp = choice.fridge ? 4 : choice.roomTemp;
  const total = cookSeconds(choice.size, choice.doneness, eggTemp);
  const set = (patch: Partial<Choice>) => onChange({ ...choice, ...patch });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-36 pt-8">
      <header className="mb-8 flex items-center gap-3">
        <Egg size={30} />
        <div>
          <h1 className="font-display text-3xl leading-none tracking-tight">Megg</h1>
          <p className="mt-1 text-sm text-ink/55">meu ovo no ponto perfeito</p>
        </div>
      </header>

      <Section title="Tamanho do ovo">
        <div className="grid grid-cols-6 items-end gap-1">
          {SIZES.map((s, i) => {
            const active = choice.size === s.id;
            return (
              <button
                key={s.id}
                onClick={() => set({ size: s.id })}
                className="relative flex flex-col items-center rounded-2xl pb-2 pt-3"
              >
                {active && (
                  <motion.span
                    layoutId="size-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-2xl bg-white shadow-soft"
                  />
                )}
                <motion.span
                  className="relative"
                  animate={{ scale: active ? 1.08 : 1, y: active ? -2 : 0 }}
                  transition={spring}
                >
                  <Egg size={26 + i * 3.6} />
                </motion.span>
                <span className={`relative mt-1.5 text-[10.5px] font-medium ${active ? "text-ink" : "text-ink/55"}`}>
                  {s.name}
                </span>
                <span className="relative text-[9.5px] tabular-nums text-ink/40">{s.range}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Onde ele estava?">
        <div className="relative grid grid-cols-2 rounded-full bg-ink/[0.05] p-1">
          {[
            { fridge: true, label: "Geladeira", icon: "❄︎" },
            { fridge: false, label: "Fora", icon: "☀︎" },
          ].map((o) => {
            const active = choice.fridge === o.fridge;
            return (
              <button
                key={o.label}
                onClick={() => set({ fridge: o.fridge })}
                className="relative rounded-full py-3 text-sm font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="place-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-white shadow-soft"
                  />
                )}
                <span className={`relative ${active ? "text-ink" : "text-ink/50"}`}>
                  <span className="mr-1.5">{o.icon}</span>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {!choice.fridge && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-5">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm text-ink/55">Temperatura ambiente</span>
                  <span className="font-display text-xl tabular-nums">
                    {choice.roomTemp}°C{" "}
                    <span className="font-sans text-xs text-ink/45">{climateLabel(choice.roomTemp)}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={40}
                  value={choice.roomTemp}
                  onChange={(e) => set({ roomTemp: Number(e.target.value) })}
                  className="temp-range w-full"
                  aria-label="Temperatura ambiente"
                />
                <div className="mt-1 flex justify-between text-[10px] text-ink/40">
                  <span>país frio</span>
                  <span>país quente</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Ponto da gema">
        <div className="grid grid-cols-2 gap-3">
          {DONENESS.map((d) => {
            const active = choice.doneness === d.id;
            return (
              <motion.button
                key={d.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => set({ doneness: d.id })}
                className={`relative flex items-center gap-3 rounded-3xl p-3 text-left transition-colors ${
                  active ? "bg-white shadow-soft" : "bg-ink/[0.035]"
                }`}
              >
                <HalfEgg doneness={d.id} size={38} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-[11px] leading-tight text-ink/50">{d.desc}</div>
                  <div className="mt-1 font-display text-base tabular-nums text-ink/80">
                    {formatTime(cookSeconds(choice.size, d.id, eggTemp))}
                  </div>
                </div>
                {active && (
                  <motion.span
                    layoutId="doneness-dot"
                    transition={spring}
                    className="absolute right-3 top-3 size-2 rounded-full bg-yolk"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </Section>

      <button
        onClick={() => setShowScience((v) => !v)}
        className="mt-2 self-start text-xs text-ink/45 underline decoration-ink/20 underline-offset-4"
      >
        {showScience ? "Esconder" : "A ciência do ovo perfeito"}
      </button>
      <AnimatePresence>
        {showScience && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 rounded-3xl bg-ink/[0.035] p-4 text-[13px] leading-relaxed text-ink/70">
              <p>A clara começa a endurecer aos <b>62°C</b> e fica firme aos <b>80°C</b>.</p>
              <p>A gema começa a engrossar aos <b>65°C</b> e fica firme aos <b>70°C</b>.</p>
              <p>
                Passou de <b>12 minutos</b>? O ferro e o enxofre reagem e surge a linha cinza-esverdeada
                em volta da gema, com cheiro forte.
              </p>
              <p className="text-ink/50">
                Tempos para ovos colocados direto na água fervendo. Ovo gelado ganha ~30 s; em países
                quentes, o ovo fora da geladeira já começa mais morno e cozinha mais rápido.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-cream via-cream to-cream/0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-center text-xs text-ink/45">
            Coloque o ovo na água já fervendo e toque em começar
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="flex w-full items-center justify-between rounded-full bg-ink px-7 py-4 text-cream shadow-lift"
          >
            <span className="text-base font-medium">Começar</span>
            <motion.span
              key={total}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-2xl tabular-nums"
            >
              {formatTime(total)}
            </motion.span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">{title}</h2>
      {children}
    </section>
  );
}
