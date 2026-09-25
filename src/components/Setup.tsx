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

const spring = { type: "spring", duration: 0.35, bounce: 0.15 } as const;
const expand = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
} as const;

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
          <p className="mt-1 text-sm text-fg-muted">No seu ponto perfeito</p>
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
                className="press relative flex flex-col items-center rounded-chip pb-2 pt-3"
              >
                {active && (
                  <motion.span
                    layoutId="size-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-chip bg-card shadow-soft"
                  />
                )}
                <motion.span
                  className="relative"
                  animate={{ transform: active ? "translateY(-2px) scale(1.08)" : "translateY(0px) scale(1)" }}
                  transition={spring}
                >
                  <Egg size={26 + i * 3.6} variant={i} />
                </motion.span>
                <span className={`relative mt-1.5 text-caption font-medium ${active ? "text-fg" : "text-fg-muted"}`}>
                  {s.name}
                </span>
                <span className="relative text-micro tabular-nums text-fg-subtle">{s.range}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Onde ele estava?">
        <div className="relative grid grid-cols-2 rounded-full bg-sunken p-1">
          {[
            { fridge: true, label: "Geladeira", icon: "❄︎" },
            { fridge: false, label: "Fora", icon: "☀︎" },
          ].map((o) => {
            const active = choice.fridge === o.fridge;
            return (
              <button
                key={o.label}
                onClick={() => set({ fridge: o.fridge })}
                className="press relative rounded-full py-3 text-sm font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="place-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-card shadow-soft"
                  />
                )}
                <span className={`relative ${active ? "text-fg" : "text-fg-muted"}`}>
                  <span className="mr-1.5">{o.icon}</span>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {!choice.fridge && (
            <motion.div {...expand} className="overflow-hidden">
              <div className="pb-4 pt-5">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm text-fg-muted">Temperatura ambiente</span>
                  <span className="font-display text-xl tabular-nums">
                    {choice.roomTemp}°C{" "}
                    <span className="font-sans text-xs text-fg-subtle">{climateLabel(choice.roomTemp)}</span>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Ponto da gema">
        <div className="grid grid-cols-2 gap-3">
          {DONENESS.map((d, i) => {
            const active = choice.doneness === d.id;
            return (
              <button
                key={d.id}
                onClick={() => set({ doneness: d.id })}
                className={`press relative flex items-center gap-3 rounded-card p-3 text-left ${
                  active ? "bg-card shadow-soft" : "bg-sunken"
                }`}
              >
                <span className="shrink-0">
                  <HalfEgg doneness={d.id} size={38} variant={i + 1} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-caption leading-tight text-fg-muted">{d.desc}</div>
                  <div className="mt-1 font-display text-base tabular-nums text-fg/80">
                    {formatTime(cookSeconds(choice.size, d.id, eggTemp))}
                  </div>
                </div>
                {active && (
                  <motion.span
                    layoutId="doneness-dot"
                    transition={spring}
                    className="absolute right-3 top-3 size-2 rounded-full bg-accent"
                  />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <button
        onClick={() => setShowScience((v) => !v)}
        className="press mt-2 self-start text-xs text-fg-subtle underline decoration-line underline-offset-4"
      >
        {showScience ? "Esconder" : "A ciência do ovo perfeito"}
      </button>
      <AnimatePresence>
        {showScience && (
          <motion.div {...expand} className="overflow-hidden">
            <div className="mt-3 space-y-2 rounded-card bg-sunken p-4 text-body-sm leading-relaxed text-fg/70">
              <p>A clara começa a endurecer aos <b>62°C</b> e fica firme aos <b>80°C</b>.</p>
              <p>A gema começa a engrossar aos <b>65°C</b> e fica firme aos <b>70°C</b>.</p>
              <p>
                Passou de <b>12 minutos</b>? O ferro e o enxofre reagem e surge a linha cinza-esverdeada
                em volta da gema, com cheiro forte.
              </p>
              <p>
                Para descascar fácil: começar na <b>água fervendo</b> é o que mais ajuda. Depois, o{" "}
                <b>banho de gelo</b> ajuda: ovo bem frio fica mais firme e rasga menos. Ovos com alguns dias também
                descascam melhor que os bem frescos.
              </p>
              <p className="text-fg-muted">
                Tempos para ovos colocados direto na água fervendo. Ovo gelado ganha ~30 s; em países
                quentes, o ovo fora da geladeira já começa mais morno e cozinha mais rápido.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-page via-page to-page/0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-center text-xs text-fg-subtle">
            Coloque o ovo na água já fervendo e toque em começar
          </p>
          <button
            onClick={onStart}
            className="press flex w-full items-center justify-between rounded-full bg-inverse px-7 py-4 text-on-inverse shadow-lift"
          >
            <span className="text-base font-medium">Começar</span>
            <span className="font-display text-2xl tabular-nums">{formatTime(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-eyebrow font-semibold uppercase text-fg-subtle">{title}</h2>
      {children}
    </section>
  );
}
