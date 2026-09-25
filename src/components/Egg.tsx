"use client";

import { useId } from "react";
import type { DonenessId } from "@/lib/eggs";

/** Egg outline params; bottom is always at y=126 so every variant shares the same footprint. */
type Shape = {
  top: number; // y of the tip
  tip: number; // horizontal reach of the tip's control points (smaller = more pointed)
  hw: number; // half-width at the equator
  eq: number; // y of the widest point
  base: number; // horizontal reach of the base's control points
  lean: number; // left/right width difference
  tilt: number; // degrees, around (50, 80)
};

function eggPath({ top, tip, hw, eq, base, lean }: Shape) {
  const l = 50 - hw - lean;
  const r = 50 + hw - lean;
  return (
    `M50 ${top} C${50 - tip} ${top} ${l} ${eq - 30} ${l} ${eq} ` +
    `C${l} ${eq + 28} ${50 - base} 126 50 126 ` +
    `C${50 + base} 126 ${r} ${eq + 28} ${r} ${eq} ` +
    `C${r} ${eq - 30} ${50 + tip} ${top} 50 ${top} Z`
  );
}

const SHAPES: Shape[] = [
  { top: 4, tip: 26, hw: 44, eq: 80, base: 24, lean: 0, tilt: 0 },
  { top: 9, tip: 30, hw: 43, eq: 78, base: 26, lean: 0.6, tilt: -2.5 },
  { top: 3, tip: 21, hw: 41.5, eq: 83, base: 23, lean: -0.5, tilt: 2 },
  { top: 6, tip: 28, hw: 43.5, eq: 81, base: 25, lean: -0.8, tilt: -1.5 },
  { top: 2, tip: 23, hw: 40.5, eq: 82, base: 22, lean: 0.5, tilt: 2.5 },
  { top: 7, tip: 27, hw: 42.5, eq: 79, base: 26, lean: 0.8, tilt: -1 },
];

type Shell = { stops: [string, string, string, string]; speckle?: string };

const SHELLS: Shell[] = [
  { stops: ["#FFFDF8", "#F7EADA", "#E6CDAE", "#CFAF8A"] }, // creme
  { stops: ["#FFFEFB", "#F8F3EA", "#EAE0D0", "#D3C4AD"] }, // branco
  { stops: ["#FFF7EC", "#F1DDC2", "#DDBF98", "#C4A076"] }, // bege
  { stops: ["#FAEBDA", "#E6C4A0", "#CFA276", "#B18357"], speckle: "#7A4E2E" }, // caipira
  { stops: ["#FDF1E2", "#EDD2B2", "#D8B288", "#BD9166"] }, // bronze claro
  { stops: ["#FBEEDF", "#EACBA8", "#D3A97E", "#B68A5E"], speckle: "#835838" }, // marrom claro
];

/** Ordered so neighbours in the size row never share a tone or shape. */
const VARIANTS: { shape: number; shell: number }[] = [
  { shape: 0, shell: 0 },
  { shape: 1, shell: 1 },
  { shape: 2, shell: 4 },
  { shape: 3, shell: 2 },
  { shape: 4, shell: 3 },
  { shape: 5, shell: 5 },
];

const SPECKLES: [number, number, number][] = [
  [30, 30, 1.1], [58, 22, 0.8], [70, 44, 1.2], [40, 52, 0.7], [24, 70, 1],
  [62, 66, 0.9], [78, 82, 0.8], [45, 88, 1.1], [30, 100, 0.8], [66, 104, 1],
  [52, 116, 0.7], [18, 88, 0.6], [50, 38, 0.6], [82, 62, 0.7], [38, 112, 0.9],
];

export function Egg({
  size = 100,
  face = false,
  variant = 0,
  className,
}: {
  size?: number;
  face?: boolean;
  variant?: number;
  className?: string;
}) {
  const id = useId();
  const v = VARIANTS[variant % VARIANTS.length];
  const shape = SHAPES[v.shape];
  const shell = SHELLS[v.shell];
  const d = eggPath(shape);
  return (
    <svg
      viewBox="0 0 100 130"
      width={size}
      height={size * 1.3}
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-shell`} cx="36%" cy="30%" r="80%">
          <stop offset="0%" stopColor={shell.stops[0]} />
          <stop offset="38%" stopColor={shell.stops[1]} />
          <stop offset="78%" stopColor={shell.stops[2]} />
          <stop offset="100%" stopColor={shell.stops[3]} />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        {shell.speckle && (
          <clipPath id={`${id}-clip`}>
            <path d={d} />
          </clipPath>
        )}
      </defs>
      <g transform={shape.tilt ? `rotate(${shape.tilt} 50 80)` : undefined}>
        <path d={d} fill={`url(#${id}-shell)`} />
        {shell.speckle && (
          <g clipPath={`url(#${id}-clip)`} fill={shell.speckle}>
            {SPECKLES.map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} opacity={0.14 + (i % 3) * 0.05} />
            ))}
          </g>
        )}
        <ellipse cx="34" cy="38" rx="11" ry="17" fill={`url(#${id}-shine)`} transform="rotate(-18 34 38)" />
      </g>
      {face && (
        <g stroke="#5B4636" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M33 78 q5 -6 10 0" />
          <path d="M57 78 q5 -6 10 0" />
          <path d="M44 88 q6 6 12 0" />
          <ellipse cx="29" cy="90" rx="6" ry="3.5" fill="#F4A7A0" stroke="none" opacity="0.7" />
          <ellipse cx="71" cy="90" rx="6" ry="3.5" fill="#F4A7A0" stroke="none" opacity="0.7" />
        </g>
      )}
    </svg>
  );
}

const YOLK: Record<DonenessId, { inner: string; outer: string; r: number; gloss: number }> = {
  liquida: { inner: "#FF9F1A", outer: "#F07F00", r: 22, gloss: 0.9 },
  cremosa: { inner: "#FFA92E", outer: "#F4B63C", r: 22, gloss: 0.55 },
  firme: { inner: "#F8B94A", outer: "#F7D26E", r: 22, gloss: 0.25 },
  cozida: { inner: "#F6D77A", outer: "#F3DC8C", r: 22, gloss: 0 },
};

export function HalfEgg({
  doneness,
  size = 64,
  variant = 0,
}: {
  doneness: DonenessId;
  size?: number;
  variant?: number;
}) {
  const id = useId();
  const y = YOLK[doneness];
  const shape = SHAPES[VARIANTS[variant % VARIANTS.length].shape];
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} aria-hidden>
      <defs>
        <radialGradient id={`${id}-white`} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="80%" stopColor="#F6F1EA" />
          <stop offset="100%" stopColor="#E8DCCB" />
        </radialGradient>
        <radialGradient id={`${id}-yolk`} cx="45%" cy="42%" r="60%">
          <stop offset="0%" stopColor={y.inner} />
          <stop offset="100%" stopColor={y.outer} />
        </radialGradient>
      </defs>
      <path
        d={eggPath(shape)}
        fill={`url(#${id}-white)`}
        transform={shape.tilt ? `rotate(${shape.tilt} 50 80)` : undefined}
      />
      {doneness === "liquida" && (
        <path d="M44 96 q6 18 12 0 q-6 4 -12 0 z" fill={y.outer} opacity="0.9" />
      )}
      <circle cx="50" cy="80" r={y.r} fill={`url(#${id}-yolk)`} />
      {doneness === "firme" && <circle cx="50" cy="80" r={9} fill="#F5A935" opacity="0.8" />}
      {y.gloss > 0 && (
        <ellipse cx="42" cy="71" rx="7" ry="4.5" fill="#FFFFFF" opacity={y.gloss * 0.7} transform="rotate(-25 42 71)" />
      )}
    </svg>
  );
}
