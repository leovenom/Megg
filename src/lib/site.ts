/** Used until a real domain is connected; override with NEXT_PUBLIC_SITE_URL at build time. */
export const FALLBACK_SITE_URL = "https://megg.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, "");

export const SITE_NAME = "Megg";
export const SITE_TAGLINE = "No seu ponto perfeito";
export const SITE_TITLE = `${SITE_NAME} · Timer de ovo cozido ${SITE_TAGLINE.toLowerCase()}`;
export const SITE_DESCRIPTION =
  "Timer de ovo cozido que calcula o tempo exato pelo tamanho do ovo, pela temperatura (geladeira ou ambiente) e pelo ponto da gema: líquida, cremosa, firme ou cozida.";
export const SITE_LOCALE = "pt_BR";

export const THEME_LIGHT = "#F6F1EA";
export const THEME_DARK = "#171311";
