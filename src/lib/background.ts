/**
 * Helpers that keep the alarm audible when the screen locks or the user switches apps:
 * a near-silent looping <audio> + Media Session (lock screen controls), notifications
 * and the service worker that shows them.
 */

const DONE_TAG = "megg-done";
const ARTWORK: MediaImage[] = [
  { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
  { src: "/icons/512.png", sizes: "512x512", type: "image/png" },
];

let keepAlive: HTMLAudioElement | null = null;

/**
 * 6 s of 16-bit mono PCM with a ±10 LSB 250 Hz square (≈ -70 dBFS): inaudible, but not digital silence,
 * which some browsers treat as "not playing". Chrome only shows lock-screen controls for media ≥ 5 s.
 */
function keepAliveUrl() {
  const rate = 8000;
  const samples = rate * 6;
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
  for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, (i >> 4) & 1 ? 10 : -10, true);
  return URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
}

/** Call from the Start tap: iOS only lets an <audio> element play from a user gesture the first time. */
export function startKeepAlive() {
  if (typeof window === "undefined") return;
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback";
  if (!keepAlive) {
    keepAlive = new Audio(keepAliveUrl());
    keepAlive.loop = true;
    keepAlive.setAttribute("playsinline", "");
  }
  resumeKeepAlive();
}

export function resumeKeepAlive() {
  void keepAlive?.play().catch(() => {});
}

export function pauseKeepAlive() {
  keepAlive?.pause();
}

export function stopKeepAlive() {
  pauseKeepAlive();
  const ms = mediaSession();
  if (!ms) return;
  ms.metadata = null;
  ms.playbackState = "none";
}

function mediaSession() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null;
}

export function setMediaInfo(artist: string, album = "") {
  const ms = mediaSession();
  if (!ms || typeof MediaMetadata === "undefined") return;
  ms.metadata = new MediaMetadata({ title: "Megg", artist, album, artwork: ARTWORK });
}

export function setMediaPosition(duration: number, position: number, playing: boolean) {
  const ms = mediaSession();
  if (!ms) return;
  ms.playbackState = playing ? "playing" : "paused";
  try {
    ms.setPositionState?.({ duration, position: Math.min(duration, Math.max(0, position)), playbackRate: 1 });
  } catch {}
}

export function clearMediaPosition() {
  try {
    mediaSession()?.setPositionState?.();
  } catch {}
}

/** Wires the lock screen play/pause buttons; returns a cleanup that unwires them. */
export function setMediaHandlers(handlers: { play?: () => void; pause?: () => void }) {
  const ms = mediaSession();
  if (!ms) return () => {};
  const set = (action: MediaSessionAction, fn: (() => void) | undefined) => {
    try {
      ms.setActionHandler(action, fn ?? null);
    } catch {}
  };
  set("play", handlers.play);
  set("pause", handlers.pause);
  return () => {
    set("play", undefined);
    set("pause", undefined);
  };
}

let permissionRequest: Promise<unknown> | null = null;

/** Call from the Start tap. Asks only once; never nags after a decision. */
export function askNotifyPermission() {
  if (typeof Notification === "undefined" || Notification.permission !== "default") return;
  try {
    permissionRequest = Notification.requestPermission().catch(() => {});
  } catch {}
}

export async function canNotify() {
  if (typeof Notification === "undefined") return false;
  await permissionRequest;
  return Notification.permission === "granted";
}

async function registration() {
  if (!("serviceWorker" in navigator)) return undefined;
  return navigator.serviceWorker.getRegistration().catch(() => undefined);
}

/** Shows the "egg is ready" notification, only when the app isn't on screen. */
export async function notifyDone(title: string, body: string) {
  if (document.visibilityState !== "hidden" || !(await canNotify())) return;
  const options = {
    body,
    tag: DONE_TAG,
    icon: "/icons/192.png",
    badge: "/icons/192.png",
    requireInteraction: true,
    renotify: true,
    vibrate: [300, 120, 300, 120, 600],
  } as NotificationOptions;
  const reg = await registration();
  try {
    if (reg) await reg.showNotification(title, options);
    else new Notification(title, options);
  } catch {}
}

export async function clearDoneNotification() {
  const reg = await registration();
  const list = await reg?.getNotifications({ tag: DONE_TAG }).catch(() => []);
  list?.forEach((n) => n.close());
}

export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
}
