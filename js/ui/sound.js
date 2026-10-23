// Habillage sonore synthétisé (Web Audio) : courts jingles rétro, jamais agressifs, désactivables.
// Aucune musique permanente.

let ctx = null;
let enabled = true;
let master = null;

export function setSoundEnabled(on) {
  enabled = !!on;
}

function audio() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.32;
      // Léger écho « plateau » : un retard filtré réinjecté.
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.11;
      const fb = ctx.createGain();
      fb.gain.value = 0.18;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      master.connect(ctx.destination);
      master.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (e) {
    return null;
  }
}

// Joue une note : fréquence, départ (s), durée (s), timbre, volume.
function tone(ac, freq, start, dur, type = 'triangle', vol = 0.5, slideTo = null) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Cloche douce : fondamentale + harmoniques légères.
function bell(ac, freq, start, dur = 0.9, vol = 0.35) {
  tone(ac, freq, start, dur, 'sine', vol);
  tone(ac, freq * 2, start, dur * 0.6, 'sine', vol * 0.35);
  tone(ac, freq * 3.01, start, dur * 0.35, 'sine', vol * 0.12);
}

const N = { C4: 261.63, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1567.98 };

const SOUNDS = {
  tap(ac) {
    tone(ac, 1320, 0, 0.05, 'square', 0.06);
  },
  select(ac) {
    tone(ac, N.G5, 0, 0.08, 'triangle', 0.25);
    tone(ac, N.C6, 0.06, 0.12, 'triangle', 0.25);
  },
  validate(ac) {
    // Petit roulement de suspense avant le verdict.
    for (let i = 0; i < 6; i++) tone(ac, 220 + i * 18, i * 0.07, 0.06, 'square', 0.05);
  },
  correct(ac) {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(ac, f, i * 0.075, 0.22, 'triangle', 0.4));
    bell(ac, N.E6, 0.3, 0.7, 0.18);
  },
  wrong(ac) {
    tone(ac, N.E4, 0, 0.22, 'sine', 0.35);
    tone(ac, N.C4, 0.18, 0.34, 'sine', 0.32);
  },
  steal(ac) {
    tone(ac, 330, 0, 0.28, 'sawtooth', 0.12, 990);
    [N.G5, N.B5, N.E6].forEach((f) => tone(ac, f, 0.28, 0.4, 'triangle', 0.22));
    [N.A5, N.C6 * 1.122, N.E6 * 1.122].forEach((f) => tone(ac, f, 0.52, 0.5, 'triangle', 0.22));
  },
  reveal(ac) {
    bell(ac, N.A5, 0, 1.1, 0.22);
    bell(ac, N.E6, 0.12, 0.9, 0.12);
  },
  turn(ac) {
    tone(ac, N.C5, 0, 0.1, 'triangle', 0.22);
    tone(ac, N.G5, 0.09, 0.16, 'triangle', 0.22);
  },
  fanfare(ac) {
    const seq = [[N.G4, 0], [N.C5, 0.12], [N.E5, 0.24], [N.G5, 0.36], [N.E5, 0.56], [N.G5, 0.66]];
    seq.forEach(([f, t]) => tone(ac, f, t, 0.2, 'triangle', 0.35));
    [N.C5, N.E5, N.G5, N.C6].forEach((f) => tone(ac, f, 0.86, 0.9, 'triangle', 0.24));
    bell(ac, N.G6, 1.0, 1.2, 0.12);
  },
};

export function sfx(name) {
  const ac = audio();
  if (!ac || !SOUNDS[name]) return;
  try {
    SOUNDS[name](ac);
  } catch (e) {
    /* le son reste un bonus */
  }
}

// iOS n'autorise l'audio qu'après un geste : on « réveille » le contexte au premier toucher.
export function unlockAudio() {
  const ac = audio();
  if (ac) tone(ac, 20, 0, 0.01, 'sine', 0.0002);
}
