let ctx: AudioContext | null = null;

/** Must be called from a user gesture so mobile browsers allow the alarm later. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  const buffer = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0);
}

function musicBoxNote(ac: AudioContext, freq: number, at: number, volume = 0.22) {
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
  out.connect(ac.destination);

  const partials: [number, number][] = [
    [1, 1],
    [2, 0.25],
    [3, 0.08],
  ];
  for (const [mult, amp] of partials) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * mult, at);
    g.gain.value = amp;
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + 1.2);
  }
}

const MELODY: [number, number][] = [
  [1318.5, 0],
  [1568.0, 0.14],
  [2093.0, 0.28],
  [1568.0, 0.5],
  [2093.0, 0.64],
  [2637.0, 0.78],
];

function playChime() {
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime + 0.02;
  for (const [freq, offset] of MELODY) musicBoxNote(ctx, freq, now + offset);
}

export function startAlarm(maxMs = 90_000) {
  playChime();
  navigator.vibrate?.([120, 80, 120, 80, 240]);
  const loop = window.setInterval(() => {
    playChime();
    navigator.vibrate?.([120, 80, 120, 80, 240]);
  }, 2400);
  const timeout = window.setTimeout(stop, maxMs);
  function stop() {
    window.clearInterval(loop);
    window.clearTimeout(timeout);
    navigator.vibrate?.(0);
  }
  return stop;
}
