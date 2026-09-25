/** Static version of the cream <Egg> (variant 0) for image routes, where React components can't render SVG defs. */
const EGG_PATH = "M50 4 C24 4 6 50 6 80 C6 108 26 126 50 126 C74 126 94 108 94 80 C94 50 76 4 50 4 Z";

const FACE =
  '<g stroke="#5B4636" stroke-width="3.2" stroke-linecap="round" fill="none">' +
  '<path d="M33 78 q5 -6 10 0"/><path d="M57 78 q5 -6 10 0"/><path d="M44 88 q6 6 12 0"/>' +
  '<ellipse cx="29" cy="90" rx="6" ry="3.5" fill="#F4A7A0" stroke="none" opacity="0.7"/>' +
  '<ellipse cx="71" cy="90" rx="6" ry="3.5" fill="#F4A7A0" stroke="none" opacity="0.7"/>' +
  "</g>";

export function eggSvg({ face = false }: { face?: boolean } = {}) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130">' +
    "<defs>" +
    '<radialGradient id="s" cx="36%" cy="30%" r="80%">' +
    '<stop offset="0%" stop-color="#FFFDF8"/><stop offset="38%" stop-color="#F7EADA"/>' +
    '<stop offset="78%" stop-color="#E6CDAE"/><stop offset="100%" stop-color="#CFAF8A"/>' +
    "</radialGradient>" +
    '<radialGradient id="g" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>' +
    "</radialGradient>" +
    "</defs>" +
    `<path d="${EGG_PATH}" fill="url(#s)"/>` +
    '<ellipse cx="34" cy="38" rx="11" ry="17" fill="url(#g)" transform="rotate(-18 34 38)"/>' +
    (face ? FACE : "") +
    "</svg>"
  );
}

export const eggDataUri = (opts?: { face?: boolean }) =>
  `data:image/svg+xml;base64,${Buffer.from(eggSvg(opts)).toString("base64")}`;
