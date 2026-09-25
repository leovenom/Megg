let ctx: AudioContext | null = null;
let chime: Promise<AudioBuffer | null> | null = null;

const CHIME_EVERY = 2.4;
const ALARM_SECONDS = 90;
const VIBRATE = [120, 80, 120, 80, 240];

/** The planned alarm window on the AudioContext clock; `out` exists once its sources are scheduled. */
let alarm: { startAt: number; endAt: number; out?: GainNode } | null = null;

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
  wakeAudio();
  const buffer = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0);
  chime ??= renderChime(ctx.sampleRate);
}

/** iOS parks the context as "suspended"/"interrupted" in the background; nudge it back. */
export function wakeAudio() {
  if (ctx && ctx.state !== "running" && ctx.state !== "closed") void ctx.resume().catch(() => {});
}

function musicBoxNote(ac: BaseAudioContext, dest: AudioNode, freq: number, at: number, volume = 0.22) {
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
    const off = new OfflineAudioContext(1, Math.round(CHIME_EVERY * sampleRate), sampleRate);
    playChime(off, off.destination, 0);
    return await off.startRendering();
  } catch {
    return null;
  }
}

/** Queues the alarm on the audio clock so it rings on time even if the page's JS is throttled. */
export function scheduleAlarm(delaySeconds: number) {
  cancelAlarm();
  if (!ctx) return;
  wakeAudio();
  const ac = ctx;
  const startAt = ac.currentTime + Math.max(0, delaySeconds);
  const plan: NonNullable<typeof alarm> = { startAt, endAt: startAt + ALARM_SECONDS };
  alarm = plan;
  void (chime ??= renderChime(ac.sampleRate)).then((buffer) => {
    if (alarm !== plan) return;
    const at = Math.max(plan.startAt, ac.currentTime + 0.02);
    plan.startAt = at;
    plan.endAt = at + ALARM_SECONDS;
    const out = ac.createGain();
    out.connect(ac.destination);
    plan.out = out;
    if (buffer) {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(out);
      src.start(at);
      src.stop(plan.endAt);
    } else {
      for (let i = 0; i * CHIME_EVERY < ALARM_SECONDS; i++) playChime(ac, out, at + i * CHIME_EVERY);
    }
  });
}

export function cancelAlarm() {
  const out = alarm?.out;
  alarm = null;
  if (!out || !ctx) return;
  out.gain.setValueAtTime(0, ctx.currentTime);
  out.disconnect();
}

/** Rings now unless the pre-scheduled alarm is already ringing (or about to). Returns a stop function. */
export function startAlarm() {
  wakeAudio();
  const now = ctx?.currentTime ?? 0;
  const ringing = alarm && now >= alarm.startAt - 0.5 && now < alarm.endAt;
  if (!ringing) scheduleAlarm(0);

  navigator.vibrate?.(VIBRATE);
  const loop = window.setInterval(() => navigator.vibrate?.(VIBRATE), CHIME_EVERY * 1000);
  const timeout = window.setTimeout(stop, ALARM_SECONDS * 1000);
  function stop() {
    window.clearInterval(loop);
    window.clearTimeout(timeout);
    navigator.vibrate?.(0);
    cancelAlarm();
  }
  return stop;
}
