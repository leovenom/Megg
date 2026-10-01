let ctx: AudioContext | null = null;
let chime: Promise<AudioBuffer | null> | null = null;
let chimeUrl: Promise<string> | null = null;

const CHIME_EVERY = 2.4;
const ALARM_SECONDS = 90;
const VIBRATE = [120, 80, 120, 80, 240];

/** The planned alarm window on the AudioContext clock; `out` exists once its sources are scheduled. */
let alarm: { startAt: number; endAt: number; out?: GainNode } | null = null;

function audioContextCtor() {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/** Must be called from a user gesture so mobile browsers allow the alarm later. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = audioContextCtor();
    if (!AC) return;
    ctx = new AC();
  }
  void wakeAudio();
  const buffer = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0);
  chime ??= renderChime(ctx.sampleRate);
  chimeUrl ??= buildChimeUrl();
}

/** iOS parks the context as "suspended"/"interrupted" in the background; nudge it back. */
export function wakeAudio(): Promise<void> {
  if (!ctx || ctx.state === "closed" || ctx.state === "running") return Promise.resolve();
  return ctx.resume().then(() => undefined).catch(() => undefined);
}

function musicBoxNote(ac: BaseAudioContext, dest: AudioNode, freq: number, at: number, volume = 0.28) {
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
  out.connect(dest);

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

function playChime(ac: BaseAudioContext, dest: AudioNode, at: number) {
  for (const [freq, offset] of MELODY) musicBoxNote(ac, dest, freq, at + offset);
}

/** One chime period rendered offline, so the whole alarm is a single looping source. */
async function renderChime(sampleRate: number): Promise<AudioBuffer | null> {
  try {
    const Offline =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Offline) return null;
    const off = new Offline(1, Math.round(CHIME_EVERY * sampleRate), sampleRate);
    playChime(off, off.destination, 0);
    return await off.startRendering();
  } catch {
    return null;
  }
}

function audioBufferToWavUrl(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const rate = buffer.sampleRate;
  const samples = buffer.length;
  const view = new DataView(new ArrayBuffer(44 + samples * channels * 2));
  const str = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + samples * channels * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples * channels * 2, true);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const x = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
}

async function buildChimeUrl() {
  const rate = ctx?.sampleRate ?? 22050;
  const buffer = await (chime ??= renderChime(rate));
  if (buffer) return audioBufferToWavUrl(buffer);
  // OfflineAudioContext can fail on some iOS builds — still need an HTMLAudio chime.
  return fallbackChimeUrl(rate);
}

/** Simple melodic PCM if OfflineAudioContext is unavailable. */
function fallbackChimeUrl(rate: number) {
  const duration = CHIME_EVERY;
  const samples = Math.round(duration * rate);
  const view = new DataView(new ArrayBuffer(44 + samples * 2));
  const str = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    let sample = 0;
    for (const [freq, offset] of MELODY) {
      const local = t - offset;
      if (local < 0 || local > 1.1) continue;
      const env = Math.exp(-local * 3.2) * (local < 0.012 ? local / 0.012 : 1);
      sample += Math.sin(2 * Math.PI * freq * local) * env * 0.22;
    }
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
  }
  return URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
}

/** Object URL of one looping chime period for HTMLAudio (works while locked on iOS). */
export function getChimeUrl(): Promise<string> {
  chimeUrl ??= buildChimeUrl();
  return chimeUrl as Promise<string>;
}

function armSources(ac: AudioContext, plan: NonNullable<typeof alarm>, buffer: AudioBuffer | null, at: number) {
  plan.startAt = at;
  plan.endAt = at + ALARM_SECONDS;
  const out = ac.createGain();
  out.gain.setValueAtTime(1, at);
  out.connect(ac.destination);
  plan.out = out;
  if (buffer) {
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(out);
    src.start(at);
    src.stop(plan.endAt);
    return;
  }
  for (let i = 0; i * CHIME_EVERY < ALARM_SECONDS; i++) playChime(ac, out, at + i * CHIME_EVERY);
}

/** Queues the alarm on the audio clock so it rings on time even if the page's JS is throttled. */
export function scheduleAlarm(delaySeconds: number) {
  cancelAlarm();
  if (!ctx) return;
  const plan: NonNullable<typeof alarm> = { startAt: 0, endAt: 0 };
  alarm = plan;
  void (async () => {
    await wakeAudio();
    if (alarm !== plan || !ctx) return;
    if (ctx.state !== "running") await wakeAudio();
    if (alarm !== plan || !ctx) return;
    const startAt = ctx.currentTime + Math.max(0, delaySeconds);
    plan.startAt = startAt;
    plan.endAt = startAt + ALARM_SECONDS;
    const buffer = await (chime ??= renderChime(ctx.sampleRate));
    if (alarm !== plan || !ctx) return;
    const at = Math.max(plan.startAt, ctx.currentTime + 0.02);
    armSources(ctx, plan, buffer, at);
  })();
}

export function cancelAlarm() {
  const out = alarm?.out;
  alarm = null;
  if (!out || !ctx) return;
  try {
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(0, ctx.currentTime);
    out.disconnect();
  } catch {}
}

/** Pulse the vibrator for the alarm window; returns a stop handle. */
export function startAlarmVibrate() {
  navigator.vibrate?.(VIBRATE);
  const loop = window.setInterval(() => navigator.vibrate?.(VIBRATE), CHIME_EVERY * 1000);
  const timeout = window.setTimeout(stop, ALARM_SECONDS * 1000);
  function stop() {
    window.clearInterval(loop);
    window.clearTimeout(timeout);
    navigator.vibrate?.(0);
  }
  return stop;
}

/**
 * Rings now via Web Audio. Prefer `ringHtmlAlarm` on the Done screen — that path
 * survives lock on iOS; calling both stacks two identical chimes on top of each other.
 */
export function startAlarm() {
  if (!ctx) unlockAudio();
  scheduleAlarm(0);
  const stopVibrate = startAlarmVibrate();
  return () => {
    stopVibrate();
    cancelAlarm();
  };
}
