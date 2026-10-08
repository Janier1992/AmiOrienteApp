/**
 * Avisos de pedidos nuevos para el negocio: sonido, notificación del navegador y
 * preferencias guardadas en el dispositivo.
 */
const SOUND_KEY = 'amio.alerts.sound';

export const getSoundPreference = () => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setSoundPreference = (on) => {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch { /* sin almacenamiento: no pasa nada */ }
};

let audioCtx = null;

/** Los navegadores solo permiten sonido después de un toque del usuario: se «desbloquea» en el primero. */
export const unlockAudio = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* sin audio */ }
};

/** Timbre corto de dos tonos (sin archivos de audio). */
export const playNewOrderChime = () => {
  try {
    unlockAudio();
    if (!audioCtx) return false;
    const now = audioCtx.currentTime;
    [[880, 0], [1175, 0.18], [880, 0.4], [1175, 0.58]].forEach(([freq, at]) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.25, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.16);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.18);
    });
    return true;
  } catch {
    return false;
  }
};

export const notificationPermission = () =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

export const requestBrowserNotifications = async () => {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export const showBrowserNotification = (title, body) => {
  if (notificationPermission() !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'amio-new-order' });
  } catch { /* algunos móviles exigen service worker: se ignora */ }
};
