export type SizeId = "industrial" | "pequeno" | "medio" | "grande" | "extra" | "jumbo";
export type DonenessId = "liquida" | "cremosa" | "firme" | "cozida";

export type EggSize = {
  id: SizeId;
  range: string;
  grams: number;
};

export type Doneness = {
  id: DonenessId;
  /** Reference seconds at 58 g, 68 g and 78 g, room temperature, into boiling water. */
  ref: [number, number, number];
};

export const SIZES: EggSize[] = [
  { id: "industrial", range: "< 45 g", grams: 42 },
  { id: "pequeno", range: "45–49 g", grams: 47 },
  { id: "medio", range: "50–54 g", grams: 52 },
  { id: "grande", range: "55–59 g", grams: 57 },
  { id: "extra", range: "60–64 g", grams: 62 },
  { id: "jumbo", range: "65 g +", grams: 68 },
];

export const DONENESS: Doneness[] = [
  { id: "liquida", ref: [270, 300, 330] },
  { id: "cremosa", ref: [360, 390, 450] },
  { id: "firme", ref: [450, 510, 570] },
  { id: "cozida", ref: [540, 600, 690] },
];

const REF_GRAMS = [58, 68, 78] as const;

export const FRIDGE_TEMP = 4;
const REF_TEMP = 20;
/** Fridge eggs (4 °C) need +30 s versus 20 °C eggs, i.e. ~1.9 s per °C for a 58 g egg. */
const SECONDS_PER_DEGREE = 30 / (REF_TEMP - FRIDGE_TEMP);

/** Heat penetration time scales with mass^(2/3) (Williams' egg formula). */
const massFactor = (grams: number) => Math.pow(grams / REF_GRAMS[0], 2 / 3);

function baseSeconds(grams: number, ref: Doneness["ref"]) {
  const [w0, w1, w2] = REF_GRAMS;
  if (grams <= w0) return ref[0] * massFactor(grams);
  if (grams <= w1) return ref[0] + ((grams - w0) / (w1 - w0)) * (ref[1] - ref[0]);
  return ref[1] + ((grams - w1) / (w2 - w1)) * (ref[2] - ref[1]);
}

export function cookSeconds(sizeId: SizeId, donenessId: DonenessId, eggTemp: number) {
  const size = SIZES.find((s) => s.id === sizeId)!;
  const doneness = DONENESS.find((d) => d.id === donenessId)!;
  const base = baseSeconds(size.grams, doneness.ref);
  const offset = (REF_TEMP - eggTemp) * SECONDS_PER_DEGREE * massFactor(size.grams);
  return Math.round((base + offset) / 5) * 5;
}

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
