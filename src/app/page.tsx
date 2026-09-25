"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Done } from "@/components/Done";
import { Setup, type Choice } from "@/components/Setup";
import { Timer } from "@/components/Timer";
import { DONENESS, FRIDGE_TEMP, SIZES, cookSeconds } from "@/lib/eggs";
import { unlockAudio } from "@/lib/sound";

type Screen = "setup" | "timer" | "done";

const DEFAULT_CHOICE: Choice = { size: "grande", fridge: true, roomTemp: 24, doneness: "cremosa" };
const STORAGE_KEY = "megg:choice";

const page = {
  initial: { opacity: 0, transform: "translateY(12px)", filter: "blur(4px)" },
  animate: {
    opacity: 1,
    transform: "translateY(0px)",
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    transform: "translateY(-8px)",
    filter: "blur(4px)",
    transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
  },
} as const;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [choice, setChoice] = useState<Choice>(DEFAULT_CHOICE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setChoice({ ...DEFAULT_CHOICE, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const updateChoice = (c: Choice) => {
    setChoice(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  const eggTemp = choice.fridge ? FRIDGE_TEMP : choice.roomTemp;
  const total = cookSeconds(choice.size, choice.doneness, eggTemp);
  const doneness = DONENESS.find((d) => d.id === choice.doneness)!;
  const size = SIZES.find((s) => s.id === choice.size)!;

  const milestones = useMemo(
    () =>
      DONENESS.map((d) => ({ id: d.id, seconds: cookSeconds(choice.size, d.id, eggTemp) })).filter(
        (m) => m.seconds <= total,
      ),
    [choice.size, eggTemp, total],
  );

  const subtitle = `${size.name} · ${choice.fridge ? "da geladeira" : `${choice.roomTemp}°C`}`;

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh overflow-x-hidden bg-page text-fg">
        <AnimatePresence mode="wait">
          {screen === "setup" && (
            <motion.div key="setup" {...page}>
              <Setup
                choice={choice}
                onChange={updateChoice}
                onStart={() => {
                  unlockAudio();
                  setScreen("timer");
                }}
              />
            </motion.div>
          )}
          {screen === "timer" && (
            <motion.div key="timer" {...page}>
              <Timer
                total={total}
                subtitle={subtitle}
                milestones={milestones}
                onCancel={() => setScreen("setup")}
                onDone={() => setScreen("done")}
              />
            </motion.div>
          )}
          {screen === "done" && (
            <motion.div key="done" {...page}>
              <Done
                doneness={choice.doneness}
                label={`Gema ${doneness.name.toLowerCase()} · ${subtitle}`}
                onReset={() => setScreen("setup")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
