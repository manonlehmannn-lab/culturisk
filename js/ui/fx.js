// Effets visuels courts : éclair de couleur, défilement des scores, points flottants, confettis.
// Tous durent moins d'une seconde et disparaissent si « animations réduites » est actif.

let reduced = false;
export function setReducedMotion(on) {
  reduced = !!on || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.classList.toggle('reduce-motion', reduced);
}
export const motionReduced = () => reduced;

function layer(cls, style = '') {
  const el = document.createElement('div');
  el.className = `fx ${cls}`;
  el.setAttribute('aria-hidden', 'true');
  if (style) el.style.cssText = style;
  document.body.appendChild(el);
  return el;
}

// Éclair radial dans la couleur du thème (bonne réponse) ou sobre (mauvaise réponse).
export function flash(color, kind = 'good') {
  if (reduced) return;
  const el = layer(`fx-flash fx-${kind}`, `--c:${color}`);
  setTimeout(() => el.remove(), 900);
}

// Rayons lumineux tournants derrière un titre (interception, victoire).
export function rays(color) {
  if (reduced) return;
  const el = layer('fx-rays', `--c:${color}`);
  setTimeout(() => el.remove(), 1400);
}

// Fait défiler un compteur digital jusqu'à sa valeur cible.
export function countUp(el, from, to, duration = 650) {
  const val = el.querySelector('.val');
  const width = val.textContent.length;
  const paint = (n) => {
    val.textContent = String(Math.round(n)).padStart(width, '!');
  };
  if (reduced || from === to) {
    paint(to);
    return;
  }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / duration);
    const e = 1 - Math.pow(1 - k, 3);
    paint(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// « +40 » qui s'envole depuis un élément.
export function floatPoints(anchor, text, color) {
  if (!anchor || reduced) return;
  const r = anchor.getBoundingClientRect();
  const el = layer('fx-float', `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--c:${color}`);
  el.textContent = text;
  setTimeout(() => el.remove(), 1100);
}

// Confettis légers (fin de partie) : quelques dizaines de rubans, 2,5 secondes.
export function confetti(colors) {
  if (reduced) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx fx-confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (canvas.width = window.innerWidth * dpr);
  const H = (canvas.height = window.innerHeight * dpr);
  const g = canvas.getContext('2d');
  const bits = Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: -Math.random() * H * 0.5,
    w: (6 + Math.random() * 6) * dpr,
    h: (10 + Math.random() * 8) * dpr,
    vy: (2 + Math.random() * 3) * dpr,
    vx: (Math.random() - 0.5) * 1.6 * dpr,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.2,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const frame = (t) => {
    const age = t - t0;
    g.clearRect(0, 0, W, H);
    g.globalAlpha = age > 2000 ? Math.max(0, 1 - (age - 2000) / 600) : 1;
    for (const b of bits) {
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      g.save();
      g.translate(b.x, b.y);
      g.rotate(b.rot);
      g.fillStyle = b.c;
      g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.rot * 2)));
      g.restore();
    }
    if (age < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
