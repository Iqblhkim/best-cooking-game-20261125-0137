// Sizzle & Serve — tiny WebAudio bleeps, no audio files. Everything is
// synthesized after the first user gesture, so the game stays silent (and
// error-free) until someone plays.
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.1); },
  place() { tone(340, 0.07, 'triangle', 0.09); },
  chop() { tone(180, 0.05, 'square', 0.06); },
  done() { tone(660, 0.1, 'sine', 0.1); tone(880, 0.14, 'sine', 0.1, 0.09); },
  serve() { tone(523, 0.1, 'sine', 0.12); tone(659, 0.1, 'sine', 0.12, 0.09); tone(784, 0.18, 'sine', 0.12, 0.18); },
  error() { tone(140, 0.18, 'sawtooth', 0.08); },
  expire() { tone(220, 0.25, 'sawtooth', 0.07); tone(165, 0.3, 'sawtooth', 0.07, 0.12); },
  click() { tone(700, 0.05, 'triangle', 0.07); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}
