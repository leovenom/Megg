"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DonenessId, SizeId } from "./eggs";

export const LANGS = ["pt", "en", "de"] as const;
export type Lang = (typeof LANGS)[number];

const HTML_LANG: Record<Lang, string> = { pt: "pt-BR", en: "en", de: "de" };
const STORAGE_KEY = "megg:lang";
const DEFAULT_LANG: Lang = "pt";

type Dict = {
  tagline: string;
  langLabel: string;
  sizeTitle: string;
  sizes: Record<SizeId, string>;
  whereTitle: string;
  fridge: string;
  outside: string;
  roomTemp: string;
  climate: [cold: string, cool: string, mild: string, warm: string, hot: string];
  donenessTitle: string;
  doneness: Record<DonenessId, { name: string; desc: string }>;
  /** Stage line in the timer and label on the done screen. */
  yolk: Record<DonenessId, string>;
  scienceShow: string;
  scienceHide: string;
  /** `**bold**` segments are rendered with <b>. */
  science: string[];
  scienceNote: string;
  startHint: string;
  start: string;
  fromFridge: string;
  whiteSetting: string;
  yolkThickening: string;
  paused: string;
  pause: string;
  resume: string;
  cancel: string;
  doneTitle: string;
  iceBath: string;
  iceBathSoft: string;
  iceBathHard: string;
  peel: string;
  stopAlarm: string;
};

const pt: Dict = {
  tagline: "No seu ponto perfeito",
  langLabel: "Idioma",
  sizeTitle: "Tamanho do ovo",
  sizes: {
    industrial: "Industrial",
    pequeno: "Pequeno",
    medio: "Médio",
    grande: "Grande",
    extra: "Extra",
    jumbo: "Jumbo",
  },
  whereTitle: "Onde ele estava?",
  fridge: "Geladeira",
  outside: "Fora",
  roomTemp: "Temperatura ambiente",
  climate: ["Frio", "Fresco", "Ameno", "Quente", "Muito quente"],
  donenessTitle: "Ponto da gema",
  doneness: {
    liquida: { name: "Líquida", desc: "Clara firme, gema escorrendo" },
    cremosa: { name: "Cremosa", desc: "Mollet, gema de colher" },
    firme: { name: "Firme", desc: "Coração macio" },
    cozida: { name: "Cozida", desc: "Totalmente cozida" },
  },
  yolk: {
    liquida: "Gema líquida",
    cremosa: "Gema cremosa",
    firme: "Gema firme",
    cozida: "Gema cozida",
  },
  scienceShow: "A ciência do ovo perfeito",
  scienceHide: "Esconder",
  science: [
    "A clara começa a endurecer aos **62°C** e fica firme aos **80°C**.",
    "A gema começa a engrossar aos **65°C** e fica firme aos **70°C**.",
    "Passou de **12 minutos**? O ferro e o enxofre reagem e surge a linha cinza-esverdeada em volta da gema, com cheiro forte.",
    "Para descascar fácil: começar na **água fervendo** é o que mais ajuda. Depois, o **banho de gelo** ajuda: ovo bem frio fica mais firme e rasga menos. Ovos com alguns dias também descascam melhor que os bem frescos.",
  ],
  scienceNote:
    "Tempos para ovos colocados direto na água fervendo. Ovo gelado ganha ~30 s; em países quentes, o ovo fora da geladeira já começa mais morno e cozinha mais rápido.",
  startHint: "Coloque o ovo na água já fervendo e toque em começar",
  start: "Começar",
  fromFridge: "da geladeira",
  whiteSetting: "A clara está firmando…",
  yolkThickening: "A gema começa a engrossar…",
  paused: "Pausado",
  pause: "Pausar",
  resume: "Continuar",
  cancel: "Cancelar",
  doneTitle: "Tá no ponto!",
  iceBath: "Leve direto a um **banho de gelo** (ou água fria corrente) para parar o cozimento",
  iceBathSoft: " e a gema não passar do ponto: 1–2 min bastam.",
  iceBathHard: ". Quanto mais frio, mais fácil descascar: deixe uns 15 min.",
  peel: "Descasque sob a água, começando pela base larga.",
  stopAlarm: "Desligar alarme",
};

const en: Dict = {
  tagline: "Just the way you like it",
  langLabel: "Language",
  sizeTitle: "Egg size",
  sizes: {
    industrial: "Mini",
    pequeno: "Small",
    medio: "Medium",
    grande: "Large",
    extra: "X-Large",
    jumbo: "Jumbo",
  },
  whereTitle: "Where was it?",
  fridge: "Fridge",
  outside: "Counter",
  roomTemp: "Room temperature",
  climate: ["Cold", "Cool", "Mild", "Warm", "Hot"],
  donenessTitle: "Yolk",
  doneness: {
    liquida: { name: "Runny", desc: "Set white, runny yolk" },
    cremosa: { name: "Jammy", desc: "Soft, spoonable yolk" },
    firme: { name: "Soft-set", desc: "Firm with a tender center" },
    cozida: { name: "Hard-boiled", desc: "Cooked all the way" },
  },
  yolk: {
    liquida: "Runny yolk",
    cremosa: "Jammy yolk",
    firme: "Soft-set yolk",
    cozida: "Hard-boiled",
  },
  scienceShow: "The science of the perfect egg",
  scienceHide: "Hide",
  science: [
    "The white starts to set at **62°C** and turns firm at **80°C**.",
    "The yolk starts to thicken at **65°C** and sets at **70°C**.",
    "Past **12 minutes**? Iron and sulfur react, leaving a greenish-grey ring around the yolk and a sulfurous smell.",
    "For easy peeling, starting in **boiling water** helps most. Then an **ice bath**: a well-chilled egg is firmer and tears less. Eggs a few days old also peel better than very fresh ones.",
  ],
  scienceNote:
    "Times assume eggs go straight into boiling water. Fridge-cold eggs need ~30 s more; in hot climates, eggs kept out of the fridge start warmer and cook faster.",
  startHint: "Lower the egg into boiling water, then tap start",
  start: "Start",
  fromFridge: "from the fridge",
  whiteSetting: "The white is setting…",
  yolkThickening: "The yolk is thickening…",
  paused: "Paused",
  pause: "Pause",
  resume: "Resume",
  cancel: "Cancel",
  doneTitle: "Ready!",
  iceBath: "Move it straight into an **ice bath** (or cold running water) to stop the cooking",
  iceBathSoft: " before the yolk sets: 1–2 min is enough.",
  iceBathHard: ". The colder it gets, the easier it peels: give it about 15 min.",
  peel: "Peel under water, starting from the wide end.",
  stopAlarm: "Stop alarm",
};

const de: Dict = {
  tagline: "Genau auf den Punkt",
  langLabel: "Sprache",
  sizeTitle: "Eiergröße",
  sizes: {
    industrial: "Mini",
    pequeno: "Klein",
    medio: "Mittel",
    grande: "Groß",
    extra: "Sehr groß",
    jumbo: "Jumbo",
  },
  whereTitle: "Wo lag das Ei?",
  fridge: "Kühlschrank",
  outside: "Draußen",
  roomTemp: "Raumtemperatur",
  climate: ["Kalt", "Kühl", "Mild", "Warm", "Heiß"],
  donenessTitle: "Eigelb",
  doneness: {
    liquida: { name: "Flüssig", desc: "Eiweiß fest, Eigelb flüssig" },
    cremosa: { name: "Wachsweich", desc: "Cremig, zum Löffeln" },
    firme: { name: "Fast fest", desc: "Fest mit weichem Kern" },
    cozida: { name: "Hart", desc: "Komplett durchgegart" },
  },
  yolk: {
    liquida: "Eigelb flüssig",
    cremosa: "Eigelb wachsweich",
    firme: "Eigelb fast fest",
    cozida: "Hart gekocht",
  },
  scienceShow: "Die Wissenschaft des perfekten Eis",
  scienceHide: "Ausblenden",
  science: [
    "Das Eiweiß beginnt bei **62°C** zu stocken und ist bei **80°C** fest.",
    "Das Eigelb wird ab **65°C** dicker und ist bei **70°C** fest.",
    "Länger als **12 Minuten**? Eisen und Schwefel reagieren: Um das Eigelb entsteht ein grüngrauer Rand, und es riecht schwefelig.",
    "Damit es sich leicht schälen lässt, hilft vor allem der Start in **sprudelnd kochendem Wasser**. Danach das **Eisbad**: Gut gekühlte Eier sind fester und reißen weniger. Ein paar Tage alte Eier lassen sich außerdem besser schälen als ganz frische.",
  ],
  scienceNote:
    "Die Zeiten gelten für Eier, die direkt ins kochende Wasser kommen. Kühlschrankeier brauchen ~30 s länger; in heißen Ländern sind Eier außerhalb des Kühlschranks schon wärmer und garen schneller.",
  startHint: "Ei ins sprudelnd kochende Wasser geben und auf Start tippen",
  start: "Start",
  fromFridge: "aus dem Kühlschrank",
  whiteSetting: "Das Eiweiß stockt…",
  yolkThickening: "Das Eigelb wird fester…",
  paused: "Pausiert",
  pause: "Pause",
  resume: "Weiter",
  cancel: "Abbrechen",
  doneTitle: "Fertig!",
  iceBath: "Direkt ins **Eisbad** (oder unter kaltes Wasser) geben, damit es nicht weitergart",
  iceBathSoft: " und das Eigelb weich bleibt: 1–2 Min. reichen.",
  iceBathHard: ". Je kälter, desto leichter lässt es sich schälen: etwa 15 Min. ziehen lassen.",
  peel: "Unter Wasser schälen, am breiten Ende beginnen.",
  stopAlarm: "Alarm aus",
};

const DICTS: Record<Lang, Dict> = { pt, en, de };

export function climateIndex(temp: number) {
  if (temp <= 12) return 0;
  if (temp <= 19) return 1;
  if (temp <= 26) return 2;
  if (temp <= 32) return 3;
  return 4;
}

/** Renders `**bold**` segments of a dictionary string with <b>. */
export function rich(text: string): ReactNode {
  return text.split("**").map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
}

function detect(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang;
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.slice(0, 2).toLowerCase();
    if ((LANGS as readonly string[]).includes(base)) return base as Lang;
  }
  return "en";
}

const I18nContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: DEFAULT_LANG,
  t: DICTS[DEFAULT_LANG],
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(detect());
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  return <I18nContext.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}
