"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DONENESS,
  SIZES,
  cookSeconds,
  formatTime,
  type DonenessId,
  type SizeId,
} from "@/lib/eggs";
import { LANGS, climateIndex, rich, useI18n, useT } from "@/lib/i18n";
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
  const { t, lang, setLang } = useI18n();
  const [showScience, setShowScience] = useState(false);
  const eggTemp = choice.fridge ? 4 : choice.roomTemp;
  const total = cookSeconds(choice.size, choice.doneness, eggTemp);
  const set = (patch: Partial<Choice>) => onChange({ ...choice, ...patch });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(10.5rem+env(safe-area-inset-bottom))] pt-8">
      <header className="mb-8 flex items-center gap-3">
        <span className="relative block h-[39px] w-[30px] shrink-0">
          <span className="absolute left-0 top-0 origin-top-left scale-50">
            <MotionConfig reducedMotion="never">
              <motion.span
                className="block origin-bottom"
                animate={{
                  transform: [
                    "translate3d(0,0,0) scale(1.06, 0.92)",
                    "translate3d(0,-8px,0) scale(0.97, 1.05)",
                    "translate3d(0,-22px,0) scale(1, 1)",
                    "translate3d(0,-3px,0) scale(0.98, 1.03)",
                    "translate3d(0,0,0) scale(1.06, 0.92)",
                  ],
                }}
                transition={{ duration: 0.8, repeat: 2, ease: "easeInOut", times: [0, 0.15, 0.5, 0.88, 1] }}
              >
                <Egg size={60} face />
              </motion.span>
            </MotionConfig>
          </span>
        </span>
        <div>
          <h1 className="font-display text-3xl leading-none tracking-tight">Megg</h1>
          <p className="mt-1 text-sm text-fg-muted">{t.tagline}</p>
        </div>
        <div role="group" aria-label={t.langLabel} className="ml-auto flex self-start rounded-full bg-sunken p-0.5">
          {LANGS.map((l) => {
            const active = lang === l;
            return (
              <button
                key={l}
                lang={l}
                onClick={() => setLang(l)}
                aria-pressed={active}
                className="press relative rounded-full px-2 py-1 text-micro font-semibold uppercase tracking-wider"
              >
                {active && (
                  <motion.span
                    layoutId="lang-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-card shadow-soft"
                  />
                )}
                <span className={`relative ${active ? "text-fg" : "text-fg-subtle"}`}>{l}</span>
              </button>
            );
          })}
        </div>
      </header>

      <Section title={t.sizeTitle}>
        <SizeCarousel value={choice.size} onChange={(size) => set({ size })} />
      </Section>

      <Section title={t.whereTitle}>
        <div className="relative grid grid-cols-2 rounded-full bg-sunken p-1">
          {[
            { fridge: true, label: t.fridge, icon: "❄︎" },
            { fridge: false, label: t.outside, icon: "☀︎" },
          ].map((o) => {
            const active = choice.fridge === o.fridge;
            return (
              <button
                key={String(o.fridge)}
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
                  <span className="text-sm text-fg-muted">{t.roomTemp}</span>
                  <span className="font-display text-xl tabular-nums">
                    {choice.roomTemp}°C{" "}
                    <span className="font-sans text-xs text-fg-subtle">{t.climate[climateIndex(choice.roomTemp)]}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={40}
                  value={choice.roomTemp}
                  onChange={(e) => set({ roomTemp: Number(e.target.value) })}
                  className="temp-range w-full"
                  aria-label={t.roomTemp}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title={t.donenessTitle}>
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
                  <div className="truncate text-sm font-semibold">{t.doneness[d.id].name}</div>
                  <div className="line-clamp-2 text-caption leading-tight text-fg-muted">{t.doneness[d.id].desc}</div>
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
        {showScience ? t.scienceHide : t.scienceShow}
      </button>
      <AnimatePresence>
        {showScience && (
          <motion.div {...expand} className="overflow-hidden">
            <div className="mt-3 space-y-2 rounded-card bg-sunken p-4 text-body-sm leading-relaxed text-fg/70">
              {t.science.map((p, i) => (
                <p key={i}>{rich(p)}</p>
              ))}
              <p className="text-fg-muted">{t.scienceNote}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-page via-page to-page/0 px-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-8">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-center text-xs text-fg-subtle">
            {t.startHint}
          </p>
          <button
            onClick={onStart}
            className="press flex w-full items-center justify-between rounded-full bg-inverse px-7 py-4 text-on-inverse shadow-lift"
          >
            <span className="text-base font-medium">{t.start}</span>
            <span className="font-display text-2xl tabular-nums">{formatTime(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const ITEM = 72;
const N = SIZES.length;
const COPIES = 5;
const MID = Math.floor(COPIES / 2);
const LOOP = Array.from({ length: COPIES * N }, (_, k) => k);
/** Focus falloff at the carousel edge; must match the size-focus keyframes in globals.css. */
const EDGE_SCALE = 0.62;
const EDGE_OPACITY = 0.4;
const SETTLE_MS = 140;

const mod = (k: number) => ((k % N) + N) % N;
const centerOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;
const leftFor = (sc: HTMLElement, el: HTMLElement) => centerOf(el) - sc.clientWidth / 2;

function nearestIndex(sc: HTMLElement, items: (HTMLElement | null)[]) {
  const c = sc.scrollLeft + sc.clientWidth / 2;
  let best = 0;
  let bestD = Infinity;
  items.forEach((el, k) => {
    if (!el) return;
    const d = Math.abs(centerOf(el) - c);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  });
  return best;
}

/** JS fallback for browsers without scroll-driven animations. */
function paintFocus(sc: HTMLElement, items: (HTMLElement | null)[], reduce: boolean) {
  const c = sc.scrollLeft + sc.clientWidth / 2;
  const half = (sc.clientWidth + ITEM) / 2;
  for (const el of items) {
    const egg = el?.firstElementChild as HTMLElement | null | undefined;
    if (!el || !egg) continue;
    const t = Math.min(1, Math.abs(centerOf(el) - c) / half);
    egg.style.opacity = String(1 - (1 - EDGE_OPACITY) * t);
    egg.style.transform = reduce ? "" : `scale(${1 - (1 - EDGE_SCALE) * t})`;
  }
}

function SizeCarousel({ value, onChange }: { value: SizeId; onChange: (id: SizeId) => void }) {
  const t = useT();
  const reduce = useReducedMotion() ?? false;
  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const pending = useRef<number | null>(null);
  const positioned = useRef(false);
  const sel = SIZES.findIndex((s) => s.id === value);
  const latest = useRef({ value, sel, onChange, reduce });
  useLayoutEffect(() => {
    latest.current = { value, sel, onChange, reduce };
  });

  useLayoutEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    if (positioned.current) {
      if (pending.current !== null && mod(pending.current) === sel) return;
      if (mod(nearestIndex(sc, items.current)) === sel) return;
    }
    const target = items.current[MID * N + sel];
    if (!target) return;
    sc.scrollLeft = leftFor(sc, target);
    positioned.current = true;
    if (!CSS.supports("animation-timeline: view()")) paintFocus(sc, items.current, latest.current.reduce);
  }, [sel]);

  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const cssDriven = CSS.supports("animation-timeline: view()");
    let frame = 0;
    let timer = 0;
    let touching = false;

    const settle = () => {
      window.clearTimeout(timer);
      if (touching) return;
      const list = items.current;
      let k = nearestIndex(sc, list);
      const home = MID * N + mod(k);
      const from = list[k];
      const to = list[home];
      if (k !== home && from && to) {
        sc.scrollLeft += centerOf(to) - centerOf(from);
        k = home;
      }
      pending.current = null;
      const id = SIZES[mod(k)].id;
      if (id !== latest.current.value) {
        navigator.vibrate?.(8);
        latest.current.onChange(id);
      }
    };
    const onScroll = () => {
      if (!cssDriven && !frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          paintFocus(sc, items.current, latest.current.reduce);
        });
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    const onResize = () => {
      const target = items.current[MID * N + latest.current.sel];
      if (target) sc.scrollLeft = leftFor(sc, target);
      if (!cssDriven) paintFocus(sc, items.current, latest.current.reduce);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(sc);
    sc.addEventListener("scroll", onScroll, { passive: true });
    sc.addEventListener("scrollend", settle);
    sc.addEventListener("touchstart", onTouchStart, { passive: true });
    sc.addEventListener("touchend", onTouchEnd, { passive: true });
    sc.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      sc.removeEventListener("scroll", onScroll);
      sc.removeEventListener("scrollend", settle);
      sc.removeEventListener("touchstart", onTouchStart);
      sc.removeEventListener("touchend", onTouchEnd);
      sc.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const pick = (k: number) => {
    const sc = scroller.current;
    const el = items.current[k];
    if (!sc || !el) return;
    pending.current = k;
    sc.scrollTo({ left: leftFor(sc, el), behavior: reduce ? "instant" : "smooth" });
    const id = SIZES[mod(k)].id;
    if (id !== value) {
      navigator.vibrate?.(8);
      onChange(id);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const sc = scroller.current;
    if (!sc) return;
    const k = nearestIndex(sc, items.current);
    const step = ({ ArrowRight: 1, ArrowLeft: -1, Home: -mod(k), End: N - 1 - mod(k) } as Record<string, number>)[
      e.key
    ];
    if (step === undefined) return;
    e.preventDefault();
    const next = k + step;
    const el = items.current[next];
    if (!el) return;
    pending.current = next;
    sc.scrollTo({ left: leftFor(sc, el), behavior: "instant" });
    items.current[MID * N + mod(next)]?.focus({ preventScroll: true });
    const id = SIZES[mod(next)].id;
    if (id !== value) onChange(id);
  };

  return (
    <div>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-chip bg-card shadow-soft"
          style={{ width: ITEM }}
        />
        <div
          ref={scroller}
          role="listbox"
          aria-label={t.sizeTitle}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="size-carousel relative flex overflow-x-auto"
          style={{ paddingInline: `calc(50% - ${ITEM / 2}px)` }}
        >
          {LOOP.map((k) => {
            const j = mod(k);
            const s = SIZES[j];
            const live = Math.floor(k / N) === MID;
            return (
              <button
                key={k}
                ref={(el) => {
                  items.current[k] = el;
                }}
                type="button"
                role="option"
                aria-selected={live ? j === sel : undefined}
                aria-hidden={live ? undefined : true}
                aria-label={live ? `${t.sizes[s.id]}, ${s.range}` : undefined}
                tabIndex={live && j === sel ? 0 : -1}
                onClick={() => pick(k)}
                className="size-carousel-item press flex shrink-0 flex-col items-center rounded-chip pb-2.5 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                style={{ width: ITEM }}
              >
                <span className="flex h-[76px] items-end pb-1.5">
                  <span className="size-carousel-egg block">
                    <Egg size={30 + j * 4} variant={j} className="block" />
                  </span>
                </span>
                <span className="size-carousel-label flex flex-col items-center">
                  <span
                    className={`whitespace-nowrap text-micro font-medium leading-tight ${
                      j === sel ? "text-fg" : "text-fg-muted"
                    }`}
                  >
                    {t.sizes[s.id]}
                  </span>
                  <span className="whitespace-nowrap text-micro tabular-nums text-fg-subtle">{s.range}</span>
                </span>
              </button>
            );
          })}
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
