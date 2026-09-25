"use client";

import { useId } from "react";
import type { DonenessId } from "@/lib/eggs";

const EGG_PATH =
  "M50 4 C24 4 6 50 6 80 C6 108 26 126 50 126 C74 126 94 108 94 80 C94 50 76 4 50 4 Z";

export function Egg({
  size = 100,
  face = false,
  className,
}: {
  size?: number;
  face?: boolean;
  className?: string;
}) {
  const id = useId();
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
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="38%" stopColor="#F7EADA" />
          <stop offset="78%" stopColor="#E6CDAE" />
          <stop offset="100%" stopColor="#CFAF8A" />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={EGG_PATH} fill={`url(#${id}-shell)`} />
      <ellipse cx="34" cy="38" rx="11" ry="17" fill={`url(#${id}-shine)`} transform="rotate(-18 34 38)" />
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

export function HalfEgg({ doneness, size = 64 }: { doneness: DonenessId; size?: number }) {
  const id = useId();
  const y = YOLK[doneness];
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
      <path d={EGG_PATH} fill={`url(#${id}-white)`} />
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
