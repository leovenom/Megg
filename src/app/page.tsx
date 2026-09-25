"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Done } from "@/components/Done";
import { Setup, type Choice } from "@/components/Setup";
import { Timer } from "@/components/Timer";
import { DONENESS, FRIDGE_TEMP, SIZES, cookSeconds } from "@/lib/eggs";
import { I18nProvider, useT } from "@/lib/i18n";
import { askNotifyPermission, notifyDone, registerServiceWorker, startKeepAlive } from "@/lib/background";
import { unlockAudio } from "@/lib/sound";

type Screen = "setup" | "timer" | "done";

const DEFAULT_CHOICE: Choice = { size: "grande", fridge: true, roomTemp: 24, doneness: "cremosa" };
const STORAGE_KEY = "megg:choice";

const page = {
  initial: { opacity: 0, transform: "translateY(12px)" },
  animate: {
    opacity: 1,
    transform: "translateY(0px)",
    transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    transform: "translateY(-8px)",
    transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
  },
} as const;

export default function Home() {
  return (
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

function App() {
  const t = useT();
  const [screen, setScreen] = useState<Screen>("setup");
  const [choice, setChoice] = useState<Choice>(DEFAULT_CHOICE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_CHOICE, ...JSON.parse(saved) };
        if (!SIZES.some((s) => s.id === parsed.size)) parsed.size = DEFAULT_CHOICE.size;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setChoice(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => registerServiceWorker(), []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      document.documentElement.style.setProperty("--app-height", `${vv.height}px`);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  const updateChoice = (c: Choice) => {
    setChoice(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  const eggTemp = choice.fridge ? FRIDGE_TEMP : choice.roomTemp;
  const total = cookSeconds(choice.size, choice.doneness, eggTemp);

  const milestones = useMemo(
    () =>
      DONENESS.map((d) => ({ id: d.id, seconds: cookSeconds(choice.size, d.id, eggTemp) })).filter(
        (m) => m.seconds <= total,
      ),
    [choice.size, eggTemp, total],
  );

  const subtitle = `${t.sizes[choice.size]} · ${choice.fridge ? t.fromFridge : `${choice.roomTemp}°C`}`;

  return (
    <MotionConfig reducedMotion="user">
      <main className="h-[var(--app-height,100svh)] overflow-hidden bg-page text-fg">
        <AnimatePresence mode="wait">
          {screen === "setup" && (
            <motion.div key="setup" className="h-full" {...page}>
              <Setup
                choice={choice}
                onChange={updateChoice}
                onStart={() => {
                  unlockAudio();
                  startKeepAlive();
                  askNotifyPermission();
                  setScreen("timer");
                }}
              />
            </motion.div>
          )}
          {screen === "timer" && (
            <motion.div key="timer" className="h-full" {...page}>
              <Timer
                total={total}
                subtitle={subtitle}
                milestones={milestones}
                onCancel={() => setScreen("setup")}
                onDone={() => {
                  void notifyDone(t.notifyTitle, `${t.yolk[choice.doneness]} · ${t.notifyBody}`);
                  setScreen("done");
                }}
              />
            </motion.div>
          )}
          {screen === "done" && (
            <motion.div key="done" className="h-full" {...page}>
              <Done
                doneness={choice.doneness}
                label={`${t.yolk[choice.doneness]} · ${subtitle}`}
                onReset={() => setScreen("setup")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
