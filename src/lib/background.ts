/**
 * Helpers that keep the alarm audible when the screen locks or the user switches apps:
 * a near-silent <audio> + Media Session (lock screen controls), notifications
 * and the service worker that shows them.
 *
 * The silent track duration matches the cook so iOS's native scrubber (0:xx / -y:yy)
 * is the real egg timer — not a looping 6s stub fighting setPositionState.
 */

import { formatTime } from "@/lib/eggs";
import { SITE_URL } from "@/lib/site";
import { cancelAlarm, getChimeUrl } from "@/lib/sound";

const DONE_TAG = "megg-done";
/** JPEG (no alpha) + cache bust — PNG corners were showing as white on the lock screen. */
const ARTWORK: MediaImage[] = [
  { src: `${SITE_URL}/icons/now-playing.jpg?v=3`, sizes: "512x512", type: "image/jpeg" },
];

let keepAlive: HTMLAudioElement | null = null;
/** Short bootstrap stub used only until the cook-length track is ready. */
let stubUrl: string | null = null;
let cookSilentUrl: string | null = null;
let mode: "silent" | "chime" = "silent";
/** True once the keep-alive element has been swapped to the looping chime. */
let htmlAlarmArmed = false;
let cookWatch: {
  endAt: number;
  totalSeconds: number;
  album: string;
  onTick: (leftMs: number) => void;
  onDone: () => void;
  done: boolean;
} | null = null;
/** Avoid rebuilding Now Playing metadata every timeupdate — that reloads artwork and flickers. */
let lastMediaKey = "";

/**
 * Near-silent PCM (±10 LSB @ 250 Hz). Not digital silence (browsers may ignore that).
 * Duration is the cook length so the lock-screen scrubber matches wall-clock progress.
 */
function silentWavUrl(seconds: number) {
  const rate = 8000;
  const samples = Math.max(rate * 5, Math.round(seconds * rate)); // ≥5s for Chrome Now Playing
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

function publishCookTitle(leftSec: number, album: string, playing: boolean) {
  const title = formatTime(leftSec);
  const key = `${title}\0${album}\0${playing ? 1 : 0}`;
  if (key === lastMediaKey) return;
  lastMediaKey = key;
  setMediaInfo(title, "Megg", album);
  const ms = mediaSession();
  if (ms) ms.playbackState = playing ? "playing" : "paused";
}

function onKeepAliveTick() {
  const watch = cookWatch;
  if (!watch || watch.done || mode !== "silent") return;
  const leftMs = Math.max(0, watch.endAt - Date.now());
  watch.onTick(leftMs);
  // Title = remaining cook time. Scrubber comes from the cook-length <audio> itself —
  // do not call setPositionState (it fights the element and freezes / loops 0:0x of 6s).
  publishCookTitle(Math.ceil(leftMs / 1000), watch.album, true);
  if (leftMs <= 0) {
    watch.done = true;
    void ringHtmlAlarm();
    watch.onDone();
  }
}

function ensureAudioElement() {
  if (keepAlive) return keepAlive;
  stubUrl ??= silentWavUrl(6);
  keepAlive = new Audio(stubUrl);
  keepAlive.setAttribute("playsinline", "");
  keepAlive.addEventListener("timeupdate", onKeepAliveTick);
  keepAlive.addEventListener("ended", onKeepAliveTick);
  return keepAlive;
}

/** Load a silent track whose duration == cook length and seek to elapsed. */
function armCookAudio(totalSeconds: number, elapsedSeconds: number) {
  const el = ensureAudioElement();
  if (cookSilentUrl) URL.revokeObjectURL(cookSilentUrl);
  cookSilentUrl = silentWavUrl(totalSeconds);
  mode = "silent";
  el.loop = false;
  el.src = cookSilentUrl;
  const seek = () => {
    try {
      el.currentTime = Math.min(Math.max(0, elapsedSeconds), Math.max(0, totalSeconds - 0.05));
    } catch {}
    void el.play().catch(() => {});
  };
  if (el.readyState >= 1) seek();
  else el.addEventListener("loadedmetadata", seek, { once: true });
}

/** Call from the Start tap: iOS only lets an <audio> element play from a user gesture the first time. */
export function startKeepAlive() {
  if (typeof window === "undefined") return;
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback";
  const el = ensureAudioElement();
  mode = "silent";
  if (!el.src) {
    stubUrl ??= silentWavUrl(6);
    el.src = stubUrl;
    el.loop = true;
  }
  void getChimeUrl();
  resumeKeepAlive();
}

export function pauseKeepAlive() {
  keepAlive?.pause();
  const ms = mediaSession();
  if (ms) ms.playbackState = "paused";
  if (cookWatch && !cookWatch.done) {
    const leftSec = Math.ceil(Math.max(0, cookWatch.endAt - Date.now()) / 1000);
    publishCookTitle(leftSec, cookWatch.album, false);
  }
}

export function resumeKeepAlive() {
  void keepAlive?.play().catch(() => {});
  const ms = mediaSession();
  if (ms && mode === "silent") ms.playbackState = "playing";
  if (cookWatch && !cookWatch.done && mode === "silent") {
    const leftSec = Math.ceil(Math.max(0, cookWatch.endAt - Date.now()) / 1000);
    publishCookTitle(leftSec, cookWatch.album, true);
  }
}

export function stopKeepAlive() {
  pauseKeepAlive();
  cookWatch = null;
  lastMediaKey = "";
  htmlAlarmArmed = false;
  if (keepAlive) {
    mode = "silent";
    keepAlive.pause();
    if (stubUrl) {
      keepAlive.loop = true;
      keepAlive.src = stubUrl;
    }
  }
  if (cookSilentUrl) {
    URL.revokeObjectURL(cookSilentUrl);
    cookSilentUrl = null;
  }
  const ms = mediaSession();
  if (!ms) return;
  ms.metadata = null;
  ms.playbackState = "none";
  clearMediaPosition();
}

/**
 * Drive lock-screen time + completion off the playing <audio> element (survives lock).
 * Arms a silent track of `totalSeconds` so the scrubber matches the cook.
 */
export function watchCookClock(opts: {
  endAt: number;
  totalSeconds: number;
  album: string;
  onTick: (leftMs: number) => void;
  onDone: () => void;
}) {
  const elapsed = Math.max(0, opts.totalSeconds - (opts.endAt - Date.now()) / 1000);
  cookWatch = { ...opts, done: false };
  lastMediaKey = "";
  armCookAudio(opts.totalSeconds, elapsed);
  clearMediaPosition();
  onKeepAliveTick();
  return () => {
    if (cookWatch?.onDone === opts.onDone) cookWatch = null;
  };
}

/** Update the lock-screen subtitle without resetting the cook clock. */
export function updateCookAlbum(album: string) {
  if (!cookWatch) return;
  cookWatch.album = album;
  const leftSec = Math.ceil(Math.max(0, cookWatch.endAt - Date.now()) / 1000);
  publishCookTitle(leftSec, album, true);
}

/** Swap the keep-alive element to the looping chime — audible while the phone is locked. */
export async function ringHtmlAlarm(title = "Megg") {
  // Stop any Web Audio schedule so we don't layer the same melody twice.
  cancelAlarm();
  if (!keepAlive) startKeepAlive();
  if (!keepAlive) return;

  const publish = () => {
    lastMediaKey = "";
    setMediaInfo(title, "Megg", "");
    clearMediaPosition();
    const ms = mediaSession();
    if (ms) ms.playbackState = "playing";
  };

  // Already looping / arming the HTML chime (cook clock + Done both call this) — don't restart.
  if (htmlAlarmArmed) {
    publish();
    void keepAlive.play().catch(() => {});
    return;
  }

  // Claim before awaiting so a second call can't start another source.
  htmlAlarmArmed = true;
  mode = "chime";
  cookWatch = null;
  const url = await getChimeUrl();
  if (!url || mode !== "chime") {
    htmlAlarmArmed = false;
    return;
  }
  keepAlive.loop = true;
  keepAlive.src = url;
  try {
    keepAlive.currentTime = 0;
  } catch {}
  void keepAlive.play().catch(() => {});
  publish();
}

function mediaSession() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null;
}

export function setMediaInfo(title: string, artist = "Megg", album = "") {
  const ms = mediaSession();
  if (!ms || typeof MediaMetadata === "undefined") return;
  ms.metadata = new MediaMetadata({ title, artist, album, artwork: ARTWORK });
}

export function setMediaPosition(duration: number, position: number, playing: boolean) {
  const ms = mediaSession();
  if (!ms) return;
  ms.playbackState = playing ? "playing" : "paused";
  if (!(duration > 0) || !Number.isFinite(duration) || !Number.isFinite(position)) return;
  try {
    ms.setPositionState?.({
      duration,
      position: Math.min(duration, Math.max(0, position)),
      playbackRate: 1,
    });
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
  for (const action of ["nexttrack", "previoustrack", "seekbackward", "seekforward", "seekto"] as const) {
    set(action, undefined);
  }
  return () => {
    set("play", undefined);
    set("pause", undefined);
  };
}

let permissionRequest: Promise<unknown> | null = null;

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
