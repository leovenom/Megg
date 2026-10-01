"use client";

import { MotionConfig, animate, motion, useMotionValue } from "motion/react";
import { useEffect, useId, useState } from "react";

/**
 * Header mascot: 3 hops → 4th hop then crack at rest, manga cry,
 * shell splits, shy face, 360 spin + Y butt → repeat.
 *
 * Always runs on iOS even with Reduce Motion — same as the old header hop.
 * Imperative `animate()` needs `reducedMotion: "never"`; MotionConfig alone
 * does not cover the standalone animate() API.
 */

type Phase = "hop" | "crack" | "cry" | "peel" | "shy" | "butt";

const HOPS_BEFORE_CRACK = 3;
const SHELL = ["#FFFDF8", "#F7EADA", "#E6CDAE", "#CFAF8A"] as const;
const PEELED = ["#FFFFFF", "#FFF9F0", "#F3E8D8", "#E8D5BE"] as const;
const STROKE = "#5B4636";
const EGG_PATH =
  "M50 4 C24 4 6 50 6 80 C6 108 26 126 50 126 C74 126 94 108 94 80 C94 50 76 4 50 4 Z";

/** Jagged seam so the split looks cracked, not a ruler cut. */
const CRACK_SEAM =
  "M50 4 L48 10 L53 16 L46 24 L52 32 L45 40 L54 48 L47 56 L53 64 L46 74 L52 84 L47 94 L53 104 L48 114 L50 126";

const LIVE = { reducedMotion: "never" as const };

/** Horizontal padding so opening shell halves stay inside the SVG (avoids main overflow-x clip). */
export const PEEL_PAD = 36;
export const PEEL_PAD_RATIO = (100 + PEEL_PAD * 2) / 100;
/** Empty space to the left of the egg silhouette — pull this back to align with section titles. */
export const logoEggLeftInset = (size: number) => (size * PEEL_PAD) / 100;

export function LogoEgg({ size = 60 }: { size?: number }) {
  const [phase, setPhase] = useState<Phase>("hop");
  const y = useMotionValue(0);
  const sx = useMotionValue(1.06);
  const sy = useMotionValue(0.92);
  const rotY = useMotionValue(0);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    async function cycle() {
      while (!cancelled) {
        setPhase("hop");
        rotY.set(0);
        for (let i = 0; i < HOPS_BEFORE_CRACK; i++) {
          if (cancelled) return;
          await Promise.all([
            animate(y, [0, -8, -22, -3, 0], {
              duration: 0.8,
              times: [0, 0.15, 0.5, 0.88, 1],
              ease: "easeInOut",
              ...LIVE,
            }),
            animate(sx, [1.06, 0.97, 1, 0.98, 1.06], {
              duration: 0.8,
              times: [0, 0.15, 0.5, 0.88, 1],
              ease: "easeInOut",
              ...LIVE,
            }),
            animate(sy, [0.92, 1.05, 1, 1.03, 0.92], {
              duration: 0.8,
              times: [0, 0.15, 0.5, 0.88, 1],
              ease: "easeInOut",
              ...LIVE,
            }),
          ]);
        }

        // 4th hop full cycle; crack after landing at resting size — not at the apex.
        if (cancelled) return;
        await Promise.all([
          animate(y, [0, -8, -26, -3, 0], {
            duration: 0.8,
            times: [0, 0.15, 0.5, 0.88, 1],
            ease: "easeInOut",
            ...LIVE,
          }),
          animate(sx, [1.06, 0.97, 0.94, 0.98, 1.06], {
            duration: 0.8,
            times: [0, 0.15, 0.5, 0.88, 1],
            ease: "easeInOut",
            ...LIVE,
          }),
          animate(sy, [0.92, 1.05, 1.08, 1.03, 0.92], {
            duration: 0.8,
            times: [0, 0.15, 0.5, 0.88, 1],
            ease: "easeInOut",
            ...LIVE,
          }),
        ]);
        if (cancelled) return;
        setPhase("crack");
        await wait(420);

        if (cancelled) return;
        setPhase("cry");
        await wait(1100);

        if (cancelled) return;
        setPhase("peel");
        await wait(1400);

        if (cancelled) return;
        setPhase("shy");
        await wait(900);

        // Full 360 whoosh → bundinha
        if (cancelled) return;
        const spin = Promise.all([
          animate(rotY, 360, { duration: 1.05, ease: [0.22, 1, 0.36, 1], ...LIVE }),
          animate(sx, [1.06, 0.88, 1.12, 1.06], {
            duration: 1.05,
            times: [0, 0.35, 0.7, 1],
            ease: "easeInOut",
            ...LIVE,
          }),
          animate(sy, [0.92, 1.1, 0.9, 0.92], {
            duration: 1.05,
            times: [0, 0.35, 0.7, 1],
            ease: "easeInOut",
            ...LIVE,
          }),
        ]);
        await wait(420);
        if (cancelled) return;
        setPhase("butt");
        await spin;
        await wait(1100);

        if (cancelled) return;
        rotY.set(0);
        setPhase("hop");
        await wait(200);
      }
    }

    void cycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      y.stop();
      sx.stop();
      sy.stop();
      rotY.stop();
    };
  }, [y, sx, sy, rotY]);

  return (
    <MotionConfig reducedMotion="never">
      <motion.span
        className="block origin-bottom overflow-visible"
        style={{
          // Extra width so peel halves stay inside the box (main has overflow-x-hidden).
          width: size * PEEL_PAD_RATIO,
          height: size * 1.3,
          y,
          scaleX: sx,
          scaleY: sy,
          rotateY: rotY,
          transformPerspective: 520,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <EggArt size={size} phase={phase} />
      </motion.span>
    </MotionConfig>
  );
}

function EggArt({ size, phase }: { size: number; phase: Phase }) {
  const id = useId();
  const peeled = phase === "peel" || phase === "shy" || phase === "butt";
  const showTopCrack = phase === "crack" || phase === "cry";
  const svgW = size * PEEL_PAD_RATIO;
  const svgH = size * 1.3;

  return (
    <svg
      viewBox={`${-PEEL_PAD} 0 ${100 + PEEL_PAD * 2} 130`}
      width={svgW}
      height={svgH}
      aria-hidden
      className="overflow-visible"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${id}-peeled`} cx="36%" cy="30%" r="80%">
          <stop offset="0%" stopColor={PEELED[0]} />
          <stop offset="38%" stopColor={PEELED[1]} />
          <stop offset="78%" stopColor={PEELED[2]} />
          <stop offset="100%" stopColor={PEELED[3]} />
        </radialGradient>
        <radialGradient id={`${id}-shell`} cx="36%" cy="30%" r="80%">
          <stop offset="0%" stopColor={SHELL[0]} />
          <stop offset="38%" stopColor={SHELL[1]} />
          <stop offset="78%" stopColor={SHELL[2]} />
          <stop offset="100%" stopColor={SHELL[3]} />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-leftCrack`}>
          <path d={`M${-PEEL_PAD} 0 L50 4 L48 10 L53 16 L46 24 L52 32 L45 40 L54 48 L47 56 L53 64 L46 74 L52 84 L47 94 L53 104 L48 114 L50 126 L${-PEEL_PAD} 130 Z`} />
        </clipPath>
        <clipPath id={`${id}-rightCrack`}>
          <path d={`M${100 + PEEL_PAD} 0 L50 4 L48 10 L53 16 L46 24 L52 32 L45 40 L54 48 L47 56 L53 64 L46 74 L52 84 L47 94 L53 104 L48 114 L50 126 L${100 + PEEL_PAD} 130 Z`} />
        </clipPath>
      </defs>

      <path d={EGG_PATH} fill={`url(#${id}-${peeled ? "peeled" : "shell"})`} />
      {phase !== "peel" && (
        <ellipse
          cx="34"
          cy="38"
          rx="11"
          ry="17"
          fill={`url(#${id}-shine)`}
          transform="rotate(-18 34 38)"
          opacity={peeled ? 0.45 : 1}
        />
      )}

      {showTopCrack && (
        <g stroke={STROKE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M50 6 L47 16 L53 26 L46 36" />
          <path d="M47 16 L40 14" />
          <path d="M53 26 L60 24" />
          <path d="M46 36 L42 42" />
          <path d="M46 36 L52 40" />
        </g>
      )}

      {phase === "peel" && (
        <>
          <motion.g
            clipPath={`url(#${id}-leftCrack)`}
            initial={{ transform: "translate(0px, 0px) rotate(0deg)" }}
            animate={{ transform: "translate(-10px, 0px) rotate(-8deg)" }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "50px 70px" }}
          >
            <path d={EGG_PATH} fill={`url(#${id}-shell)`} />
            <ellipse cx="34" cy="38" rx="11" ry="17" fill={`url(#${id}-shine)`} transform="rotate(-18 34 38)" />
            <path d={CRACK_SEAM} stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
          </motion.g>
          <motion.g
            clipPath={`url(#${id}-rightCrack)`}
            initial={{ transform: "translate(0px, 0px) rotate(0deg)" }}
            animate={{ transform: "translate(10px, 0px) rotate(8deg)" }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
            style={{ transformOrigin: "50px 70px" }}
          >
            <path d={EGG_PATH} fill={`url(#${id}-shell)`} />
            <path d={CRACK_SEAM} stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
          </motion.g>
          <InnerFace />
        </>
      )}

      {phase === "hop" && <HappyFace />}
      {phase === "crack" && <WinceFace />}
      {phase === "cry" && <MangaCryFace />}
      {phase === "shy" && <ShyFace />}
      {phase === "butt" && <ButtY />}
    </svg>
  );
}

function HappyFace() {
  return (
    <g stroke={STROKE} strokeWidth="3.2" strokeLinecap="round" fill="none">
      <path d="M33 78 q5 -6 10 0" />
      <path d="M57 78 q5 -6 10 0" />
      <path d="M44 88 q6 6 12 0" />
      <ellipse cx="29" cy="90" rx="6" ry="3.5" fill="#F4A7A0" stroke="none" opacity="0.7" />
      <ellipse cx="71" cy="90" rx="6" ry="3.5" fill="#F4A7A0" stroke="none" opacity="0.7" />
    </g>
  );
}

function WinceFace() {
  return (
    <g stroke={STROKE} strokeWidth="3.2" strokeLinecap="round" fill="none">
      <path d="M33 80 q5 5 10 0" />
      <path d="M57 80 q5 5 10 0" />
      <path d="M46 92 q4 -3 8 0" />
    </g>
  );
}

function MangaCryFace() {
  return (
    <g>
      <path d="M30 68 q8 4 14 1" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M56 69 q8 -1 14 -4" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M32 78 q6 5 12 0" stroke={STROKE} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M56 78 q6 5 12 0" stroke={STROKE} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="80" r="1.4" fill="#FFFFFF" opacity="0.9" />
      <circle cx="60" cy="80" r="1.4" fill="#FFFFFF" opacity="0.9" />
      <path d="M44 94 q3 4 6 0 q3 4 6 0" stroke={STROKE} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <motion.path
        d="M34 86 C34 86 28 96 34 102 C40 96 34 86 34 86 Z"
        fill="#8EC5F0"
        stroke="#6AA9D8"
        strokeWidth="0.8"
        initial={{ y: 0, opacity: 0.95, scale: 0.7 }}
        animate={{ y: [0, 10, 20], opacity: [0.95, 0.85, 0], scale: [0.85, 1, 1.05] }}
        transition={{ duration: 0.85, repeat: 1, ease: "easeIn" }}
      />
      <motion.path
        d="M66 86 C66 86 60 97 66 104 C72 97 66 86 66 86 Z"
        fill="#8EC5F0"
        stroke="#6AA9D8"
        strokeWidth="0.8"
        initial={{ y: 0, opacity: 0.95, scale: 0.7 }}
        animate={{ y: [0, 12, 22], opacity: [0.95, 0.8, 0], scale: [0.8, 1, 1.05] }}
        transition={{ duration: 0.9, delay: 0.1, repeat: 1, ease: "easeIn" }}
      />
    </g>
  );
}

/** Face on the peeled body — brows, soft eyes, uwu mouth. No blush. */
function InnerFace() {
  return (
    <g stroke={STROKE} strokeLinecap="round" fill="none">
      <path d="M34 72 h12" strokeWidth="1.8" opacity="0.7" />
      <path d="M54 72 h12" strokeWidth="1.8" opacity="0.7" />
      <path d="M34 80 q6 -4 12 0" strokeWidth="2.6" />
      <path d="M54 80 q6 -4 12 0" strokeWidth="2.6" />
      <path d="M46 92 q2 3 4 0 q2 3 4 0" strokeWidth="2.2" />
    </g>
  );
}

/** Embarrassed peek — eyes aside, blush, tiny mouth. */
function ShyFace() {
  return (
    <g>
      <ellipse cx="26" cy="88" rx="9" ry="5.5" fill="#F4A7A0" opacity="0.85" />
      <ellipse cx="74" cy="88" rx="9" ry="5.5" fill="#F4A7A0" opacity="0.85" />
      <circle cx="36" cy="78" r="3.2" fill={STROKE} />
      <circle cx="62" cy="78" r="3.2" fill={STROKE} />
      <circle cx="37.2" cy="76.8" r="1.1" fill="#FFFFFF" />
      <circle cx="63.2" cy="76.8" r="1.1" fill="#FFFFFF" />
      <path d="M47 92 q3 3 6 0" stroke={STROKE} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <motion.path
        d="M78 58 C78 58 74 66 78 70 C82 66 78 58 78 58 Z"
        fill="#B8D9F0"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: [0, 1, 1], y: [-4, 0, 2] }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </g>
  );
}

/** Soft thin Y + tiny heart on the right cheek. */
function ButtY() {
  return (
    <g>
      <path
        d="M40 80 C45 88 48 94 50 102 C51 106 53 110 55 112 M50 98 C53 91 57 85 62 80"
        stroke={STROKE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M68 92 C68 92 65 89 63 91 C61 93 63 96 68 100 C73 96 75 93 73 91 C71 89 68 92 68 92 Z"
        fill="#F4A7A0"
        stroke={STROKE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>
  );
}
